import $ from 'jquery';
import {parseCode, removeLocals, labelIFStatements} from './code-analyzer';
import * as escodegen from 'escodegen';

function extracted(withoutLocals) {

    let input = $('#input').val(), inputsplitted = input.split(',');
    //$('#parsedCode').append(JSON.stringify(withoutLocals));
    // window.alert(JSON.stringify(withoutLocals));

    let newParsed = parseCode(escodegen.generate(withoutLocals));
    // window.alert(3);

    let [greens, reds] = labelIFStatements(newParsed, inputsplitted);
    // window.alert(4);

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

        let codeToParse = $('#codePlaceholder').val();
        let parsedCode = parseCode(codeToParse);

        let withoutLocals = removeLocals(parsedCode);
        let insert = extracted(withoutLocals);
        $('#parsedCode').append(insert);
    });
});
