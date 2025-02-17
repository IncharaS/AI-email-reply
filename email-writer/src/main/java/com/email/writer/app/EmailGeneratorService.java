package com.email.writer.app;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Service
public class EmailGeneratorService {

    private final WebClient webClient;

    @Value("${gemini.api.url}")
    private String geminiApiUrl;
    @Value("${gemini.api.key}")
    private String geminiApiKey;

    public EmailGeneratorService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    public String generateEmailReply(EmailRequest emailRequest) {
        // PART 1 Build Request in the below format
//        {
//            "contents": [{
//            "parts":[{"text": "Explain how AI works"}]
//        }]
//        }
        String prompt = buildPrompt(emailRequest);
        Map<String, Object> requestBody = Map.of(
                "contents", new Object[]{
                        Map.of("parts", new Object[]{
                                Map.of("text", prompt)
                        })
                }
        );


        // PART 2 - Send Request and get response

        String response = webClient.post()
                .uri(geminiApiUrl + geminiApiKey)
                .header("Content-Type", "application/json")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .block();


        // Return the Extracted response ->
        return extractResponseContent(response);
    }


    //Return the response
    //        {
    //            "candidates": [
    //            {
    //                "content": {
    //                "parts": [
    //                {
    //                    "text": "Artificial intelligence (AI) is a broad field encompassing many approaches, ..........
    private String extractResponseContent(String response) {
        try {
            // ObjectMapper converts json to java objects and vice - versa
            ObjectMapper mapper = new ObjectMapper();
            // Forms a tree like structure, makes it easy to navigate through
            JsonNode rootNode = mapper.readTree(response);
            return rootNode.path("candidates")
                    .get(0) //first item of candidate array
                    .path("content")
                    .path("parts")
                    .get(0) //first item of parts array
                    .path("text").asText();
        } catch (Exception e) {
            return "Error processing request:" + e.getMessage();

        }

    }


    private String buildPrompt(EmailRequest emailRequest) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Generate a Professional Email reply for the following email content. Please don't generate a Subject Line");
        if (emailRequest.getTone() != null && !emailRequest.getTone().isEmpty()) {
            prompt.append("Use a ").append(emailRequest.getTone()).append("tone.");
        }
        prompt.append("\n Original Email: \n").append(emailRequest.getEmailContent());
        return prompt.toString();
    }
}

