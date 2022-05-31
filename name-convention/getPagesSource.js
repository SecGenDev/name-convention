function getElByTestId(testId) {
    return document.querySelectorAll("[data-test-id='" + testId + "']")?.[0];
}

function getTaskNumber() {
    const a = getElByTestId('issue.views.issue-base.foundation.breadcrumbs.breadcrumb-current-issue-container')?.innerText;
    const b = getElByTestId('issue.views.issue-base.foundation.breadcrumbs.breadcrumb-parent-issue-container')?.innerText;
    return a || b || '#';
}

function getTaskTitle() {
    return getElByTestId('issue.views.issue-base.foundation.summary.heading')?.innerText || 'empty';
}

chrome.runtime.sendMessage({
    action: "getSource",
    source: {
        taskNumber: getTaskNumber(),
        title: getTaskTitle(),
        body: document.getElementsByClassName('ak-renderer-document')?.[0]?.innerHTML,
        bodyText: document.getElementsByClassName('ak-renderer-document')?.[0]?.innerText,
    }
});
