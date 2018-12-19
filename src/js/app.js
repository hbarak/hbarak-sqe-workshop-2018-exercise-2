import $ from 'jquery';
import {parseCode,parseCodeWithoutLoc, removeLocals, labelIFStatements} from './code-analyzer';
import * as escodegen from 'escodegen';
import * as esprima from "esprima";
//import generate from 'escodegen';

function extracted(withoutLocals) {
    let input = $('#input').val(), inputsplitted = input.split(',');
    let newParsed = parseCode(escodegen.generate(withoutLocals));
    let [greens, reds] = labelIFStatements(newParsed, inputsplitted);

    window.alert("greens: " + greens);
    window.alert("reds: " + reds);

    let splilines = escodegen.generate(newParsed).split('\n');
    let insert = '';
    for (let i = 0; i < splilines.length; i++) {
        insert += greens.includes(i + 1) ?
            '<mark style = \'background-color: green;\'' + '>' + splilines[i] + '</mark>' + '<br>' : reds.includes(i + 1) ?
                '<mark style = \'background-color: red;\'' + '>' + splilines[i] + '</mark>' + '<br>' : splilines[i] + '<br>';
    }
    return insert;
}

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        // let inCode = 'function foo(x, y, z){ \n' +
        //     '    let a = y + 1;\n' +
        //     '    while (z < 10) {\n' +
        //     '        z = 5*a;\n' +
        //     '    }\n' +
        //     '    \n' +
        //     '    return z;\n' +
        //     '}';
        // let outCode = 'function foo(x, y, z) {\n' +
        //     'while (z < 10) {\n' +
        //     'z = 5*(y + 1);\n' +
        //     '}\n' +
        //     'return z;\n' +
        //     '}';
        // let parsedInCode = parseCodeWithoutLoc(inCode);
        // let parsedOutCode = parseCodeWithoutLoc(outCode);
        // let withoustLocals = removeLocals(parsedInCode);
        // window.alert(escodegen.generate(parsedOutCode));
        // window.alert(escodegen.generate(withoustLocals));
        // return;
        let codeToParse = $('#codePlaceholder').val();
        let parsedCode = parseCode(codeToParse);

        window.alert(JSON.stringify(parsedCode));
        let withoutLocals = removeLocals(parsedCode);
        //$('#parsedCode').text(escodegen.generate(withoutLocals));
        //$('#parsedCode').text(JSON.stringify(withoutLocals, null,2));
        let insert = extracted(withoutLocals);
        $('#parsedCode').append(insert);
    });
});
