import * as esprima from 'esprima';
//import * as safeEval  from 'safe-eval';
import * as escodegen from 'escodegen';

let Parser = require('expr-eval').Parser;
var parser = new Parser();
let reds = [], greens = [];
const parseCode = (codeToParse) => {
    //let x = evalByType['none'](1,2);
    return esprima.parseScript(codeToParse,{loc:true});
};

const parseCodeWithoutLoc = (codeToParse) => {
    //let x = evalByType['none'](1,2);
    return esprima.parseScript(codeToParse);
};

//code-json
// const paintCode = (code)=>{
//     for(let i=0; i<code.length-1; i++){
//         if(code[i] === 'i' && code[i+1] === 'f'){
//             let counter = 1;
//             for(let j= i+4; j<code.length-1; j++){
//                 if(code[j] === ')') counter--;
//                 else if( code[j] === '(') counter ++;
//
//                 if(counter === 0){
//                     //code[i] = 'i'
//                     //code[i+1] = 'f'
//                     //code[i+2] = ' '
//                     //code[i+3] = '('
//                     //...
//                     //code[j] = ')
//                     let first = code.substring(0,i);
//                     let second = code.substring(i,j+1);
//                     let third = code.substring(j+1, code.length);
//
//                 }
//
//             }
//         }
//     }
// };

//evals- key,val hashamp; value - value with optionals keys(locals)
//value is of type Literal | BinaryExpression | Identifier | MemberExpression | UnaryExpression | UpdateExpression
//returns new value
function effect(evals, value){
    let newValue = evalByType[value.type](value, evals);
    return newValue;

}

const evalByType = {
    'Literal': function(node){
        return node;
    },
    'Identifier': function(node, evals){
        if(evals[node.name]){
            return evals[node.name];
        }
        return node;
    },
    'BinaryExpression': function(node, evals){
        let newNode = node;
        newNode.left = effect(evals, node.left);
        newNode.right = effect(evals, node.right);
        return newNode;
    },
    // 'MemberExpression': function(node, evals){
    //     let newNode = node;
    //     newNode.object = effect(evals, node.object);
    //     newNode.property = effect(evals, node.property);
    //     return newNode;
    // },
    'ArrayExpression':function(node){
        return node;
    },
    'UnaryExpression': function(node, evals){
        let newNode = node;
        newNode.argument = effect(evals, node.argument);
        return newNode;
    },
    // 'UpdateExpression': function(node, evals) {
    //     let operator = node.operator === '++' ? '+' : '-';
    //  },
    // 'UpdateExpression': function(node, evals){
    //     if(evals[node.argument.name]) {
    //         let operator = node.operator === '++' ? '+' : '-';
    //         let newNode =
    //             {
    //                 type: 'ExpressionStatement',
    //                 expression: {
    //                     type: 'AssignmentExpression',
    //                     operator: '=',
    //                     left: node.argument,
    //                     right: {
    //
    //                         type: 'BinaryExpression',
    //                         operator: operator,
    //                         left: node.argument,
    //                         right: {
    //                             type: 'Literal',
    //                             value: 1,
    //                             raw: '1'
    //                         }
    //                     }
    //                 }
    //             };
    //
    //     }
    // },

};

const removeLocals = (node )=>{
    let newProgramBody = [];
    for(let i=0; i<node.body.length; i++){
        let statement = node.body[i];
        if (statement.type === 'FunctionDeclaration') {
            let body = statement.body.body, newBody = [], evals = {};
            let newFunction = statement;
            for(let j=0; j<body.length; j++){
                let statement_minor = body[j];
                let newStatement;
                [newStatement,evals] = getNewEvals(statement_minor, evals);
                if(newStatement != null) newBody.push(newStatement);
            }
            newFunction.body.body = newBody;
            newProgramBody.push(newFunction);
        }else newProgramBody.push(statement);
    }
    node.body = newProgramBody;
    return node;
};

const getNewEvals = (node, evals)=>{
    //window.alert(JSON.stringify(node));
    return whatToDo[node.type](node, evals);
};

const whatToDo = {
    //defining locals
    'VariableDeclaration': function(node, evals){
        let newEvals = evals;
        for(let i=0; i<node.declarations.length; i++){
            let declarator = node.declarations[i];
            if(declarator.init.type === 'UpdateExpression'){
                [declarator.init, evals] = getNewEvals(declarator.init, evals);
            }
            let newValue = effect(evals, declarator.init);
            newEvals[declarator.id.name] = newValue;
        }
        return [null, newEvals];
    },
    'ExpressionStatement': function(node, evals){
        let expr = node.expression;
        let id, left, right;
        if(expr.type === 'UpdateExpression'){
            id = expr.argument.name; left = expr.argument;
            right = {type: 'BinaryExpression', operator: expr.operator === '++'? '+':'-', left: expr.argument, right: {type: 'Literal', value: 1,raw: '1' } };}
        else if (expr.type === 'AssignmentExpression'){
            id = expr.left.name; left = expr.left; right = expr.right;
        }
        if(evals[id]){
            let newValue = effect(evals, right);
            evals[left.name] = newValue;
            return [null, evals];
        }

        let newRight = effect(evals, right);
        node.right = newRight;
        return [node, evals];
    },
    'UpdateExpression': function(node, evals){
        let newValue = effect(evals, {
            type: 'BinaryExpression',
            operator: node.operator === '++'? '+':'-',
            left: node.argument,
            right: {
                type: 'Literal',
                value: 1,
                raw: '1'
            }
        });
        evals[node.argument.name] = newValue;
        return [node.argument, evals];

    },
    'IfStatement': function(node, evals){
        node.test = effect(evals, node.test);
        let newConsequent = [];
        let newEvals = JSON.parse(JSON.stringify(evals));
        for(let i=0; i<node.consequent.body.length; i++){
            let assignment = node.consequent.body[i];
            let newAssignment;
            [newAssignment, newEvals] = getNewEvals(assignment,newEvals);
            if(newAssignment != null) newConsequent.push(newAssignment);

        }
        node.consequent.body = newConsequent;
        newEvals = evals;
        if(node.alternate != null) {
            let newAlternate;
            [newAlternate, newEvals] = getNewEvals(node.alternate, newEvals);
            node.alternate = newAlternate;
        }
        return [node, evals];
    },
    'WhileStatement': function(node, evals){
        node.test = effect(evals, node.test);
        let newWhileBodyBody = [];
        let newEvals = JSON.parse(JSON.stringify(evals));
        //for(const assignment in node.consequent.body) {
        for(let i=0; i<node.body.body.length; i++){
            let assignment = node.body.body[i];
            let newAssignment;
            //window.alert(JSON.stringify(assignment));
            [newAssignment, newEvals] = getNewEvals(assignment,newEvals);
            //window.alert(JSON.stringify(newAssignment));

            // if(newAssignment != null)
            newWhileBodyBody.push(newAssignment);
        }
        node.body.body = newWhileBodyBody;

        return [node, evals];
    },
    'ReturnStatement': function(node, evals){
        //let newReturn = node;
        node.argument = effect(evals, node.argument);
        return [node, evals];
    },
    'BlockStatement': function(node, evals){
        let newBody=[];
        for(let i=0; i<node.body.length; i++){
            let newNode, newEvals=evals;
            [newNode, newEvals] = getNewEvals(node.body[i],newEvals);
            // if(newNode != null)
            newBody.push(newNode);
        }
        node.body = newBody;
        return [node, evals];
    },
    // null:function(node, evals){
    //     return [null, evals];
    // }

};

function extracted(statement, IV, args) {
    for (let j = 0; j < statement.params.length; j++) IV[statement.params[j].name] = parser.evaluate(args[j]);
}

//node - program
const labelIFStatements = (node, args)=>{
    let GLOBALS = {}, IV={};
    reds=[]; greens = [];
    for( let i=0; i<node.body.length; i++){
        let statement = node.body[i];
        if(statement.type === 'VariableDeclaration'){
            for(let i=0; i<statement.declarations.length; i++){
                let declarator = statement.declarations[i];
                GLOBALS[declarator.id.name] = parser.evaluate(escodegen.generate(declarator.init));
            }
        }
        else if(statement.type === 'FunctionDeclaration'){
            extracted(statement, IV, args);
            labelIfAndEval(statement, IV, GLOBALS);
            break;
        }
    }
    return [greens, reds];
};
const labelIfAndEval = (node, IV, GLOBALS) =>{
    if(node == null) return [IV,GLOBALS];
    if(node.type === 'ReturnStatement'
        || node.type === 'WhileStatement') return [IV, GLOBALS];
    else return findIF[node.type](node, IV, GLOBALS);

};
const findIF = {
    'FunctionDeclaration': function(node, IV, GLOBALS) {
        for(let i=0; i<node.body.body.length; i++){
            [IV,GLOBALS] = labelIfAndEval(node.body.body[i], IV,GLOBALS);
        }
        return [IV,GLOBALS];
    },
    'IfStatement': function(node, IV, GLOBALS){
        //let safeeval = safeEval()

        //window.alert(JSON.stringify(node));
        let context = getContext(IV,GLOBALS);
        [IV, GLOBALS] = labelIfAndEval(node.consequent, IV, GLOBALS);
        if( parser.evaluate( escodegen.generate(node.test), context) )  {
            greens.push(node.loc.start.line);
            [IV, GLOBALS] = labelIfAndEval(node.alternate, IV, GLOBALS);
        }
        else {
            let newIV = Object.assign({}, IV), newGLOBALS = Object.assign({},GLOBALS);
            reds.push(node.loc.start.line);
            [IV, GLOBALS] = labelIfAndEval(node.alternate, newIV, newGLOBALS);
        }
        return [IV, GLOBALS];
    },
    'BlockStatement': function(node, IV, GLOBALS){
        for(let i=0; i<node.body.length; i++){
            let statement = node.body[i];
            [IV, GLOBALS] = labelIfAndEval(statement, IV, GLOBALS);
        }
        return [IV, GLOBALS];
    },
    // 'WhileStatement': function(node, IV, GLOBALS){
    //     for(let i=0; i<node.body.body.length; i++) {
    //         [IV, GLOBALS] = labelIF(node.body.body[i], IV, GLOBALS);
    //     }
    //     return [IV, GLOBALS];
    // },
    'ExpressionStatement': function(node, IV, GLOBALS){
        let expr = node.expression;
        [IV, GLOBALS] = labelIfAndEval(expr, IV, GLOBALS);
        return [IV,GLOBALS];
    },
    'UpdateExpression':function(node, IV, GLOBALS) {
        let group = IV.hasOwnProperty(node.argument.name)?
            IV:GLOBALS;

        group[node.argument.name] = node.operator === '++' ?
            parser.evaluate(group[node.argument.name] + '+1') : parser.evaluate(group[node.argument.name] + '-1');

        return [IV,GLOBALS];
    },
    'AssignmentExpression':function(node, IV, GLOBALS) {
        //window.alert(JSON.stringify(IV));
        let group = IV.hasOwnProperty(node.left.name)?
            IV:GLOBALS;
        let context = getContext(IV,GLOBALS);
        group[node.left.name] = parser.evaluate(escodegen.generate(node.right), context);
        return [IV,GLOBALS];
    },
    // 'VariableDeclaration':function(node,IV,GLOBALS){
    //     return [IV,GLOBALS];
    // }

};

const getContext = (IV, GLOBALS)=>{
    let context = {};
    for(const property in IV){
        //window.alert(property);
        context[property] = IV[property];
    }
    for(const property in GLOBALS){
        if(!context.hasOwnProperty(property)) context[property] = GLOBALS[property];
    }
    return context;

};
//
// const insertValues = (string, IV, GLOBALS)=>{
//     for(const property in IV){
//         string.replace(property,IV[property]);
//     }
//     for(const property in GLOBALS){
//         string.replace(property,GLOBALS[property]);
//     }
//     return string;
// };

// const safeEvalGames = ()=>{
//     let x = 'x + 0';
//     window.alert(safeEval(x,{x:1}));
// };

export {parseCode,parseCodeWithoutLoc, removeLocals, labelIFStatements};
