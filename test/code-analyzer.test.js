import assert from 'assert';
import {parseCode, parseCodeWithoutLoc, removeLocals,labelIFStatements} from '../src/js/code-analyzer';
import * as escodegen from "escodegen";

describe('The javascript parser', () => {
    it('is parsing an empty function correctly', () => {
        assert.equal(
            JSON.stringify(parseCode('')),
            '{"type":"Program","body":[],"sourceType":"script","loc":{"start":{"line":0,"column":0},"end":{"line":0,"column":0}}}'
        );
    });

    it('is parsing a simple variable declaration correctly', () => {
        assert.equal(
            JSON.stringify(parseCode('let a = 1;')),
            '{"type":"Program","body":[{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"a","loc":{"start":{"line":1,"column":4},"end":{"line":1,"column":5}}},"init":{"type":"Literal","value":1,"raw":"1","loc":{"start":{"line":1,"column":8},"end":{"line":1,"column":9}}},"loc":{"start":{"line":1,"column":4},"end":{"line":1,"column":9}}}],"kind":"let","loc":{"start":{"line":1,"column":0},"end":{"line":1,"column":10}}}],"sourceType":"script","loc":{"start":{"line":1,"column":0},"end":{"line":1,"column":10}}}'
        );
    });
});

describe('The removeLocals function', ()=> {
    it('is removing local vars from functions', () => {
        let inCode = 'function foo(x, y, z){' +
            'let a = x + 1;' +
            'let b = a + y;' +
            'let c = 0;' +
            '}';
        let outCode = 'function foo(x, y, z) {\n' +
            '}';
        let parsedInCode = parseCodeWithoutLoc(inCode);
        let parsedOutCode = parseCodeWithoutLoc(outCode);
        let withoustLocals = removeLocals(parsedInCode);
        assert.equal(
            JSON.stringify(withoustLocals),
            JSON.stringify(parsedOutCode));
    });

    it('is not removing global variables vars from functions', () => {
        let inCode = 'let G = 1;\n' +
            'function foo(x, y, z){\n' +
            '    let a = x + 1;\n' +
            '    let b = a + y;\n' +
            '    let c = 0;\n' +
            '    return G;\n' +
            '}';
        let outCode = 'let G = 1;\n' +
            'function foo(x, y, z) {\n' +
            'return G;\n' +
            '}';
        let parsedInCode = parseCodeWithoutLoc(inCode);
        let parsedOutCode = parseCodeWithoutLoc(outCode);
        let withoustLocals = removeLocals(parsedInCode);
        assert.equal(
            JSON.stringify(withoustLocals),
            JSON.stringify(parsedOutCode));
    });

    it('is removing local vars from functions', () => {
        let inCode = 'function foo(x, y, z){\n' +
            '    let a = x + 1;\n' +
            '    let b = a + y;\n' +
            '    let c = b++;\n' +
            '    return c;\n' +
            '}';
        let outCode = 'function foo(x, y, z) {\n' +
            'return x + 1 + y + 1;\n' +
            '}';
        let parsedInCode = parseCodeWithoutLoc(inCode);
        let parsedOutCode = parseCodeWithoutLoc(outCode);
        let withoustLocals = removeLocals(parsedInCode);
        assert.equal(
            JSON.stringify(withoustLocals),
            JSON.stringify(parsedOutCode));
    });

    it('is removing local vars from functions with if statement', () => {
        let inCode = 'function foo(x, y, z){\n' +
            '   if(x==y){\n' +
            '     return 1;\n' +
            '   }\n' +
            '   return 2;\n' +
            '}';
        let outCode = 'function foo(x, y, z) {\n' +
            'if (x == y) {\n' +
            'return 1;\n' +
            '}\n' +
            'return 2;\n' +
            '}';
        let parsedInCode = parseCodeWithoutLoc(inCode);
        let parsedOutCode = parseCodeWithoutLoc(outCode);
        let withoustLocals = removeLocals(parsedInCode);
        assert.equal(
            JSON.stringify(withoustLocals),
            JSON.stringify(parsedOutCode));
    });

    it('is removing local vars from functions with while statements', () => {
        let inCode = 'function foo(x, y, z){ \n' +
            '    let a = y + 1;\n' +
            '    while (z < 10) {\n' +
            '        z = 5*a;\n' +
            '    }\n' +
            '    \n' +
            '    return z;\n' +
            '}';
        let outCode = 'function foo(x, y, z) {\n' +
            'while (z < 10) {\n' +
            'z = 5*(y + 1);\n' +
            '}\n' +
            'return z;\n' +
            '}';
        let parsedInCode = parseCodeWithoutLoc(inCode);
        let parsedOutCode = parseCodeWithoutLoc(outCode);
        let withoustLocals = removeLocals(parsedInCode);
        assert.equal(
            JSON.stringify(parseCodeWithoutLoc(escodegen.generate(withoustLocals))),
            JSON.stringify(parseCodeWithoutLoc(escodegen.generate(parsedOutCode))));
    });

    it('is removing local vars from functions with unary expressions', () => {
        let inCode = 'function foo(x, y, z){\n' +
            '    let a = -1;\n' +
            '    return a;\n' +
            '}';
        let outCode = 'function foo(x, y, z) {\n' +
            'return -1;\n' +
            '}';
        let parsedInCode = parseCodeWithoutLoc(inCode);
        let parsedOutCode = parseCodeWithoutLoc(outCode);
        let withoustLocals = removeLocals(parsedInCode);
        assert.equal(
            JSON.stringify(parseCodeWithoutLoc(escodegen.generate(withoustLocals))),
            JSON.stringify(parseCodeWithoutLoc(escodegen.generate(parsedOutCode))));
    });


    it('is removing local vars from functions with update expressions', () => {
        let inCode = 'function foo(x, y, z){\n' +
            '    let a = 0;\n' +
            '    a++;\n' +
            '    return a;\n' +
            '}';
        let outCode = 'function foo(x, y, z) {\n' +
            'return 0 + 1;\n' +
            '}';
        let parsedInCode = parseCodeWithoutLoc(inCode);
        let parsedOutCode = parseCodeWithoutLoc(outCode);
        let withoustLocals = removeLocals(parsedInCode);
        assert.equal(
            JSON.stringify(parseCodeWithoutLoc(escodegen.generate(withoustLocals))),
            JSON.stringify(parseCodeWithoutLoc(escodegen.generate(parsedOutCode))));
    });

    it('is removing local vars from functions with update expressions', () => {
        let inCode = 'function foo(x, y, z){\n' +
            'let a=[1];\n' +
            'return a;\n' +
            '}\n';
        let outCode = 'function foo(x, y, z) {\n' +
            'return [1];\n' +
            '}';
        let parsedInCode = parseCodeWithoutLoc(inCode);
        let parsedOutCode = parseCodeWithoutLoc(outCode);
        let withoustLocals = removeLocals(parsedInCode);
        assert.equal(
            JSON.stringify(parseCodeWithoutLoc(escodegen.generate(withoustLocals))),
            JSON.stringify(parseCodeWithoutLoc(escodegen.generate(parsedOutCode))));
    });

    it('is removing local vars from functions with update expressions', () => {
        let inCode = 'function foo(x, y, z){\n' +
            'let b=0;\n' +
            'b++;\n' +
            'b--;\n' +
            'b=b+1;\n' +
            'let a=b+1;\n' +
            '\n' +
            'if(a>b){\n' +
            'let d=1;\n' +
            '}\n' +
            'return a;\n' +
            '}\n';
        let outCode = 'function foo(x, y, z) {\n' +
            'if (0 + 1 - 1 + 1 + 1 > 0 + 1 - 1 + 1) {\n' +
            '}\n' +
            'return 0 + 1 - 1 + 1 + 1;\n' +
            '}';
        let parsedInCode = parseCodeWithoutLoc(inCode);
        let parsedOutCode = parseCodeWithoutLoc(outCode);
        let withoustLocals = removeLocals(parsedInCode);
        assert.equal(
            JSON.stringify(parseCodeWithoutLoc(escodegen.generate(withoustLocals))),
            JSON.stringify(parseCodeWithoutLoc(escodegen.generate(parsedOutCode))));
    });


    it('is removing local vars nested in if', () => {
        let inCode = 'function foo(x, y, z){\n' +
            '    if (x + 1 + y < z) {\n' +
            '        let a =5;\n' +
            '        return x + y + z + a;\n' +
            '    } else if (x + 1 + y < z * 2) {\n' +
            '        return x + y + z + x + 5;\n' +
            '    } else {\n' +
            '        return x + y + z + z + 5;\n' +
            '    }\n' +
            '}\n';
        let outCode = 'function foo(x, y, z) {\n' +
            'if (x + 1 + y < z) {\n' +
            'return x + y + z + 5;\n' +
            '} else if (x + 1 + y < z * 2) {\n' +
            'return x + y + z + x + 5;\n' +
            '} else {\n' +
            'return x + y + z + z + 5;\n' +
            '}\n' +
            '}';
        let parsedInCode = parseCodeWithoutLoc(inCode);
        let parsedOutCode = parseCodeWithoutLoc(outCode);
        let withoustLocals = removeLocals(parsedInCode);
        assert.equal(
            JSON.stringify(parseCodeWithoutLoc(escodegen.generate(withoustLocals))),
            JSON.stringify(parseCodeWithoutLoc(escodegen.generate(parsedOutCode))));
    });
});


describe('labelIFStatements', () => {
    it('is true if statements with green', () => {
        let inputsplitted = ['1','2','3'];
        let code = 'function foo(x, y, z) {\n' +
            'if (x + 1 + y < z) {\n' +
            'return x + y + z + (0 + 5);\n' +
            '} else if (x + 1 + y < z * 2) {\n' +
            'return x + y + z + (0 + x + 5);\n' +
            '} else {\n' +
            'return x + y + z + (0 + z + 5);\n' +
            '}\n' +
            '}';

        let [greens, reds] = labelIFStatements(parseCode(code), inputsplitted);
        assert.equal(greens.toString(),[4].toString());
        assert.equal(reds.toString(),[2].toString());
    });

    it('is true if statements with green', () => {
        let inputsplitted = ['1','2','3'];
        let code = 'let G = 0;\n' +
            'function foo(x, y, z) {\n' +
            'if (x + 1 + y < z) {\n' +
            'return x + y + z + 5;\n' +
            '} else if (x + 1 + y < z * 2) {\n' +
            'return x + y + z + x + 5;\n' +
            '} else {\n' +
            'return x + y + z + z + 5;\n' +
            '}\n' +
            '}';

        let [greens, reds] = labelIFStatements(parseCode(code), inputsplitted);
        assert.equal(greens.toString(),[5].toString());
        assert.equal(reds.toString(),[3].toString());
    });

    it('is true if statements with green', () => {
        let inputsplitted = ['1','2','3'];
        let code = 'function foo(x, y, z) {\n' +
            'if (x + 1 + y < z) {\n' +
            'return x + y + z + 5;\n' +
            '} else if (x + 1 + y < z * 2) {\n' +
            'return x + y + z + x + 5;\n' +
            '}\n' +
            'while (x > y) {\n' +
            'x++;\n' +
            '}\n' +
            'return x++;\n' +
            '}';

        let [greens, reds] = labelIFStatements(parseCode(code), inputsplitted);
        assert.equal(greens.toString(),[4].toString());
        assert.equal(reds.toString(),[2].toString());
    });

    it('is true if statements with green', () => {
        let inputsplitted = ['1','2','3'];
        let code = 'function foo(x, y, z) {\n' +
            'if (x == 1) {\n' +
            'x++;\n' +
            'x = x + 1;\n' +
            'return x;\n' +
            '}\n' +
            'return y;\n' +
            '}';

        let [greens, reds] = labelIFStatements(parseCode(code), inputsplitted);
        assert.equal(greens.toString(),[2].toString());
        assert.equal(reds.toString(),[].toString());
    });

    it('is true if statements with green', () => {
        let inputsplitted = ['1','2','3'];
        let code = 'function foo(x, y, z) {\n' +
            'x++;\n' +
            'x = x + 1;\n' +
            'return x;\n' +
            '}';

        let [greens, reds] = labelIFStatements(parseCode(code), inputsplitted);
        assert.equal(greens.toString(),[].toString());
        assert.equal(reds.toString(),[].toString());
    });

    it('is true if statements with green', () => {
        let inputsplitted = ['1','2','3'];
        let code = 'function foo(x, y, z) {\n' +
            'return [1];\n' +
            '}';

        let [greens, reds] = labelIFStatements(parseCode(code), inputsplitted);
        assert.equal(greens.toString(),[].toString());
        assert.equal(reds.toString(),[].toString());
    });

    it('is true if statements with green', () => {
        let inputsplitted = ['1','2','3'];
        let code = 'let g=8;\n' +
            'function foo(x, y, z){\n' +
            '    if (x < z) {\n' +
            '        if(y < z){\n' +
            '            return 1;\n' +
            '        }\n' +
            '        return 2;\n' +
            '    }\n' +
            '    g++;' +
            '    g=g+1;' +
            '    x--;' +
            '    return 3;\n' +
            '}';

        let [greens, reds] = labelIFStatements(parseCode(code), inputsplitted);
        assert.equal(greens.toString(),[4,3].toString());
        assert.equal(reds.toString(),[].toString());

        inputsplitted = ['1','5','3'];
        [greens, reds] = labelIFStatements(parseCode(code), inputsplitted);
        assert.equal(greens.toString(),[3].toString());
        assert.equal(reds.toString(),[4].toString());
    });


});