const state = {
    taskNumber: '',
    title: '',
    body: '',
    bodyText: '',
    mType: 'feat',
    scope: 'app',
    path: ''
};

const defaultScopeList = [
    'app',
    'attacks',
    'authorization',
    'charts',
    'common',
    'dashboard',
    'dashboards',
    'filters',
    'firewall',
    'fw-events',
    'fw-rules',
    'help',
    'mocks',
    'notifications',
    'operators',
    'prefixes',
    'signatures',
    'styles',
    'user-logs',
    'users',
    'views',
    'white-list'
];

function convertToBranchName(s) {
    return s.replace(/\[\S+\]/g, ' ')
        .replace(/[^a-zA-Z0-9]/g, ' ')
        .trim()
        .replace(/\s+/g, '_');
}

function clearCommitMsg(s) {
    return s.replace(/\[\S+\]/g, '').trim();
}

function saveCurrentSettings() {
    const info = {};
    info[state.taskNumber] = {
        mType: state.mType,
        scope: state.scope
    };

    chrome.storage.sync.set(info, () => console.log('State saved', info));
}


function generate() {

    const message = clearCommitMsg(state.title);

    state.mType = document.getElementById('mType').value;
    state.scope = document.getElementById('scope').value;
    state.path = document.getElementById('path').value;

    const reviewers = document.getElementById('reviewers').value
        .replace(/\r\n/g, "\n")
        .split("\n")
        .map(u => u.trim())
        .filter(u => u)
        .map(u => `* @${u}`)
        .join('\n');

    saveCurrentSettings();

    document.getElementById('branch').value = `${state.taskNumber}-${convertToBranchName(message)}`;
    document.getElementById('commit').value = `${state.mType}(${state.scope}): ${message} (#${state.taskNumber})`;

    const body = state?.bodyText || '';

    document.getElementById('description').value = `
## Reviewers
${reviewers}

## Description
### ${state.title} [(${state.taskNumber})](${state.path}/${state.taskNumber})

${body}

---

## Root Cause Analysis
TEXT

## Solution Description
TEXT

## Test Cases
### Test 1

TEXT
`;
}

chrome.runtime.onMessage.addListener(function (request, sender) {
    if (request.action == "getSource") {
        Object.assign(state, request.source);

        chrome.storage.sync.get([state.taskNumber, 'reviewers', 'scopeList', 'path'], (items) => {

            document.getElementById('reviewers').value = items?.reviewers?.length > 0
                ? items.reviewers.join("\n")
                : ['username'].join("\n");

            const scopeList = items?.scopeList?.length > 0
                ? items.scopeList
                : defaultScopeList;

            document.getElementById('path').value = items?.path || 'https://secgen.atlassian.net/browse/';

            createScopeList(scopeList);

            if (items && items[state.taskNumber]) {
                document.getElementById('scope').value = items[state.taskNumber].scope;
                document.getElementById('mType').value = items[state.taskNumber].mType;
            }

            generate();
        });

    }
});

function createScopeList(scopeList) {
    document.getElementById('scope-list').value = scopeList.join("\n");
    document.getElementById('scope').innerHTML = '';

    scopeList.forEach(s => {
        const option = document.createElement("option");
        option.value = s;
        option.text = s;
        document.getElementById('scope').appendChild(option);
    });

}

function selfSelectContent() {
    this.setSelectionRange(0, this.value.length);
}

async function getTab() {
    let queryOptions = {active: true, currentWindow: true};
    let tabs = await chrome.tabs.query(queryOptions);
    return tabs[0];
}

function onWindowLoad(o) {

    let message = document.querySelector('#message');

    getTab().then(currentTab => {

        chrome.scripting.executeScript({
            target: {tabId: currentTab.id, allFrames: true},
            files: ["getPagesSource.js"]
        }, function () {

            document.getElementById('scope').addEventListener("click", generate);
            document.getElementById('mType').addEventListener("click", generate);

            document.getElementById('branch').addEventListener("click", selfSelectContent);
            document.getElementById('commit').addEventListener("click", selfSelectContent);
            document.getElementById('description').addEventListener("click", selfSelectContent);
            document.getElementById('settings-toggle').addEventListener("click", () => {
                document.getElementById('settings-box').toggleAttribute("hidden");
            });

            document.getElementById('save-settings').addEventListener("click", () => {

                const reviewers = document.getElementById('reviewers').value
                    .replace(/\r\n/g, "\n")
                    .split("\n")
                    .map(u => u.trim())
                    .filter(u => u) || [];

                const scopeList = document.getElementById('scope-list').value
                    .replace(/\r\n/g, "\n")
                    .split("\n")
                    .map(u => u.trim())
                    .filter(u => u) || [];

                const path = document.getElementById('path').value || '';

                chrome.storage.sync.set({reviewers, scopeList, path}, () => {
                    console.log('Reviewers and scopeList saved', reviewers, scopeList)
                    generate();
                });
            });

            if (chrome.runtime.lastError) {
                message.innerText = 'There was an error injecting script : \n' + chrome.runtime.lastError.message;
            }
        });


    });


}

window.onload = onWindowLoad;
