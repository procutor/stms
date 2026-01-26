const fs = require('fs');
const ts = require('typescript');

try {
    const content = fs.readFileSync('src/app/dashboard/school-admin/assignments/page.tsx', 'utf8');
    const sourceFile = ts.createSourceFile(
        'page.tsx',
        content,
        ts.ScriptTarget.ESNext,
        true
    );
    
    console.log('File parsed successfully!');
    
    // Check for syntax errors
    const errors = [];
    const walk = (node) => {
        if (node.kind === ts.SyntaxKind.ErrorNode) {
            const text = sourceFile.text.substring(node.pos, node.end);
            const line = sourceFile.getLineAndCharacterOfPosition(node.pos).line + 1;
            const col = sourceFile.getLineAndCharacterOfPosition(node.pos).character + 1;
            errors.push(`Error at line ${line}, column ${col}: ${text}`);
        }
        ts.forEachChild(node, walk);
    };
    
    walk(sourceFile);
    
    if (errors.length > 0) {
        console.log('\\nSyntax errors found:');
        errors.forEach(err => console.log(err));
    } else {
        console.log('\\nNo syntax errors detected');
    }
} catch (error) {
    console.error('Error parsing file:', error);
}
