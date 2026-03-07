const fs = require('fs');

const data = JSON.parse(fs.readFileSync('vague-toasts.json', 'utf8'));

function getReplacement(file, content) {
    const lfile = file.toLowerCase();
    const lcontent = content.toLowerCase();
    
    // Auth / Login
    if (lfile.includes('login') || lfile.includes('auth')) {
        if (lcontent.includes('invalid') || lcontent.includes('credentials')) return "Incorrect email or password. Please try again.";
        if (lcontent.includes('failed to login') || lcontent.includes('error')) return "We couldn't log you in. Please check your connection and try again.";
        if (lcontent.includes('too short')) return "Your password must be at least 6 characters.";
    }
    
    // Users / Admin
    if (lfile.includes('user')) {
        if (lcontent.includes('failed to create')) return "We couldn't create this user. Please ensure the email isn't already registered.";
        if (lcontent.includes('failed to update')) return "We couldn't save these changes. Please check the fields and try again.";
        if (lcontent.includes('permission') || lcontent.includes('unauthorized')) return "You don't have the required permissions to do this.";
        if (lcontent.includes('format')) return "Please enter a valid international phone number (e.g., +61412345678).";
    }
    
    // Forms / Data
    if (lcontent.includes('failed to load')) return "We couldn't load this data. Please refresh the page.";
    if (lcontent.includes('failed to fetch')) return "We're having trouble connecting to the server. Please try again later.";
    if (lcontent.includes('failed to save') || lcontent.includes('failed to update')) return "Your changes couldn't be saved. Please try again.";
    if (lcontent.includes('failed to delete')) return "This item couldn't be deleted. It might be referenced by other records.";
    if (lcontent.includes('went wrong') || lcontent.includes('unexpected')) return "Something unexpected happened. Please try refreshing the page.";
    if (lcontent.includes('too short')) return "The information you entered is too short. Please add more details.";
    if (lcontent.includes('permission') || lcontent.includes('unauthorized')) return "You don't have permission to access or modify this information.";
    
    // Fallback based on text
    if (lcontent.includes('error')) return "An error occurred. Please check your internet connection and try again.";
    if (lcontent.includes('failed')) return "This action couldn't be completed. Please try again.";
    if (lcontent.includes('invalid')) return "Some of the information you entered is invalid. Please check the form and try again.";

    return "Please check your input and try again.";
}

const uniqueGroups = {};
data.forEach(item => {
    let msg = item.content.trim();
    msg = msg.replace(/^['"\`]/, '').replace(/['"\`]$/, '');
    
    const key = item.file + '|' + msg;
    if (!uniqueGroups[key]) {
        uniqueGroups[key] = {
            file: item.file.replace(/\\\\/g, '/').replace('app/', '').replace('components/', ''),
            original: msg,
            proposed: getReplacement(item.file, msg)
        };
    }
});

let markdown = '# Toast Notification System Update Plan\n\n';
markdown += '## 1. Current State Assessment\n';
markdown += `Scanned the codebase and identified **${Object.keys(uniqueGroups).length} unique instances** (out of ${data.length} total vague occurrences) of vague, generic, or non-user-centric error messages. Common issues include exposing raw error objects to the user (e.g., \`error.message\`), using generic phrasing like "Failed to update", and failing to provide actionable resolution steps.\n\n`;

markdown += '## 2. Tone Guidelines\n';
markdown += '- **Helpful & Direct:** Always explain *what* happened without jargon.\n';
markdown += '- **Actionable:** Tell the user *how* to fix the issue if possible (e.g., "Check your internet connection", "Refresh the page").\n';
markdown += '- **Non-technical:** Never show raw server errors, status codes like "400", or variable names.\n\n';

markdown += '## 3. Edge Cases & Missing Scenarios\n';
markdown += '- **Network Timeouts:** The app currently relies heavily on generic "catch-all" errors. We need specific "Connection timed out" toasts.\n';
markdown += '- **Conflict Errors:** E.g., "Email already exists" is often swallowed by a generic "Failed to create user".\n';
markdown += '- **Payload Too Large:** Images or files exceeding size limits often just return "Failed to upload" instead of specifying the size limit.\n\n';

markdown += '## 4. Mapping Table\n\n';
markdown += '| Location (Component/Route) | Current Vague Message | Proposed Clear Message |\n';
markdown += '| :--- | :--- | :--- |\n';

Object.values(uniqueGroups).forEach(group => {
    let orig = group.original.replace(/\\|/g, ' or ').replace(/\n/g, ' ');
    let prop = group.proposed.replace(/\\|/g, ' or ').replace(/\n/g, ' ');
    markdown += `| \`${group.file}\` | "${orig}" | "${prop}" |\n`;
});

fs.writeFileSync('toast-update.md', markdown);
console.log('Successfully wrote toast-update.md');
