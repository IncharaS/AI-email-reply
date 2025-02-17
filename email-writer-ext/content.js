console.log("SCRIPT LOADED IN THE RIGHT WAY")

function createAIbutton() {
    const button = document.createElement('div');
    // inspect google mail reply button
    button.className = 'T-I J-J5-Ji aoO v7 T-I-atl L3'
    button.style.marginRight = '8px';
    button.innerHTML = 'AI reply';
    button.setAttribute('role', 'button');
    // before it was the same
    button.setAttribute('data-tooltip', 'Reply with AI');
    //before it was data-tooltip="Send (Ctrl-Enter)"
    return button;
}

function findComposeToolBar() {
    // how to find the toolbar
    const selectors = [
        '.btC',
        '.aDh',
        '.gU.Up', //exclusive to google
        '[role="toolbar"]' //generic toolbar selector
    ];
    for (const selector of selectors) {
        const toolbar = document.querySelector(selector);
        if (toolbar) {
            return toolbar;
        }
        return null;
    }
}

function getEmailConetent() {
    const selectors = [
        '.h7',
        '.a3s.aiL', /// className found in inspect of email body and reply body
        '.gmail_quote', 
        '[role="presentation"]' 
    ];
    for (const selector of selectors) {
        const content = document.querySelector(selector);
        if (content) {
            return content.innerText.trim();
        }
        return '';
    }
}

function injectButton() {
    const existingButton = document.querySelector('.ai-reply-button');
    if (existingButton) existingButton.remove();

    const toolbar = findComposeToolBar();
    if (!toolbar) {
        console.log("Not Found -  Toolbar");
        return;
    }

    console.log(" Found Toolbar!!!");
    const button = createAIbutton();
    button.classList.add('.ai-reply-button');

    button.addEventListener('click', async () => {
        try {
            button.innerHTML = 'Generating..';
            button.disabled = true;
            const emailContent = getEmailConetent();
            const response = await fetch('http://localhost:8080/api/email/generate',
                {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    emailContent: emailContent,
                    tone: "professional"
                })
            });

            if (!response.ok) {
                throw new Error('Request Failed');
            }

            const generatedReply = await response.text();
            const composeBox = document.querySelector('[role="textbox"][g_editable="true"]');

            if (composeBox) {
                composeBox.focus();
                document.execCommand('insertText', false, generatedReply);
                // execCommand performs various actions on the doc, like formating etc
            } else {
                console.error('Composebox - not found');
            }
}
        catch(error){
            console.log(error);
            alert('Couldnt generate reply');
        }
        finally {
            // remove the loading state ( while generating .... )
            button.innerHTML = 'AI reply';
            button.disabled = false;
            // the one disabled in CreateAIbutton
        }
});

    toolbar.insertBefore(button, toolbar.firstChild);
}


const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        const addedNodes = Array.from(mutation.addedNodes);
        //list of new changes
        const hasComposeElements = addedNodes.some(node =>
            node.nodeType === Node.ELEMENT_NODE &&
            (node.matches('.aDh, .btC, [role="dialog"]') || node.querySelector('.aDh, .btC, [role="dialog"]'))
            // if the node matches or querySelector (any childern of the node matches)
            // .btC button near Reply for Email
            // [role="dialog"] when a new chat window is opened
        );

        if (hasComposeElements) {
            console.log("Compose Window Detected");
            setTimeout(injectButton, 500);
            // 500 milisec, 0.5 seconds -  before we inject button - to ensure than gmail is fully loaded 
        }
    }

});

observer.observe(document.body, {
    childList: true,
    subtree: true
    // watch changes in all descendents as well
})