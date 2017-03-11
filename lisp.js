(function (exports) {
    var addBindingToFrame, addProcedure, allocObject, assignmentValue, assignmentVariable, bufferMax, car, cdr, cons, defineSymbol, defineVariable, definitionValue, definitionVariable, eatExpectedString, eatWhitespace, enclosingEnvironment, evalAssignment, evalDefinition, extendEnvironment, firstExp, firstFrame, firstOperand, frameValues, frameVariables, getc, htmlPair, ifAlternative, ifConsequent, ifPredicate, ifSymbol, init, isAlpha, isApplication, isAssignment, isBoolean, isCharacter, isCompoundProc, isDefinition, isDelimiter, isDigit, isFalse, isFixnum, isIf, isInitial, isLambda, isLastExp, isNoOperands, isPair, isPrimitiveProc, isQuoted, isSelfEvaluating, isSpace, isSpecial, isString, isSymbol, isTaggedList, isTheEmptyList, isTrue, isVariable, lambdaBody, lambdaParamters, lambdaSymbol, lispF, lispT, listOfValues, lookupVariableValue, operands, operator, makeCharacter, makeCompoundProc, makeFixnum, makeFrame, makeLambda, makePrimitiveProc, makeSpan, makeString, makeSymbol, okSymbol, peek, peekExpectedDelimiter, procAdd, procCar, procCdr, procCharToInteger, procCons, procIntegerToChar, procIsBoolean, procIsChar, procIsEq, procIsGreaterThan, procIsInteger, procIsLessThan, procIsNull, procIsNumberEqual, procIsPair, procIsProcedure, procIsString, procIsSymbol, procList, procMul, procNumberToString, procQuotient, procRemainder, procSetCar, procSetCdr, procStringToNumber, procStringToSymbol, procSub, procSymbolToString, quoteSymbol, readCharacter, readPair, restExps, restOperands, setSymbol, setCar, setCdr, setupEnvironment, setVariableValue, symbolTable, textOfQuotation, theEmptyEnvironment, theEmptyList, ungetc, writePair;

    addBindingToFrame = function (variable, value, frame) {
        setCar(frame, cons(variable, car(frame)));
        setCdr(frame, cons(value, cdr(frame)));
    };

    addProcedure = function (schemeName, jsName) {
        defineVariable(makeSymbol(schemeName),
                      makePrimitiveProc(jsName),
                      exports.theGlobalEnvironment);
    };

    allocObject = function () {
        return { type: "BLANK" };
    };

    assignmentValue = function (exp) {
        return car(cdr(cdr(exp)));
    };

    assignmentVariable = function (exp) {
        return car(cdr(exp));
    };

    bufferMax = 1000;

    car = function (pair) {
        return pair.pair.car;
    };

    cdr = function (pair) {
        return pair.pair.cdr;
    };

    cons = function (car, cdr) {
        var obj;

        obj = allocObject();
        obj.type = "PAIR";
        obj.pair = {
            car: car,
            cdr: cdr
        };

        return obj;
    };

    defineVariable = function (variable, val, env) {
        var frame, vars, vals;

        frame = firstFrame(env);
        vars = frameVariables(frame);
        vals = frameValues(frame);

        while (!isTheEmptyList(vars)) {
            if (variable === car(vars)) {
                setCar(vals, val);

                return;
            }

            vars = cdr(vars);
            vals = cdr(vals);
        }

        addBindingToFrame(variable, val, frame);
    };

    definitionValue = function (exp) {
        if (isSymbol(car(cdr(exp)))) {
            return car(cdr(cdr(exp)));
        }

        return makeLambda(cdr(car(cdr(exp))), cdr(cdr(exp)));
    };

    definitionVariable = function (exp) {
        if (isSymbol(car(cdr(exp)))) {
            return car(cdr(exp));
        }

        return car(car(cdr(exp)));
    };

    eatExpectedString = function (s, str) {
        var c, i;

        for (i = 0; i < str.length; i++) {
            c = getc(s);

            if (c !== str.substring(i, i + 1)) {
                throw("unexpected character '" + c + "'");
            }
        }
    };

    eatWhitespace = function (s) {
        var c;

        while ((c = getc(s)) !== null) {
            if (isSpace(c)) {
                continue;
            }

            if (c === ";") {
                while ((c = getc(s)) !== null && c !== "\n") { continue; }
                continue;
            }

            ungetc(s);

            break;
        }
    };

    enclosingEnvironment = function (env) {
        return cdr(env);
    };

    evalAssignment = function (exp, env) {
        setVariableValue(assignmentVariable(exp),
                         exports.eval(assignmentValue(exp), env),
                         env);

        return okSymbol;
    };

    evalDefinition = function (exp, env) {
        defineVariable(definitionVariable(exp),
                       exports.eval(definitionValue(exp), env),
                       env);

        return okSymbol;
    };

    extendEnvironment = function (variables, values, baseEnv) {
        return cons(makeFrame(variables, values), baseEnv);
    };

    firstExp = function (seq) {
        return car(seq);
    };

    firstFrame = function (env) {
        return car(env);
    };

    firstOperand = function (ops) {
        return car(ops);
    };

    frameValues = function (frame) {
        return cdr(frame);
    };

    frameVariables = function (frame) {
        return car(frame);
    };

    getc = function (s) {
        var c;

        c = peek(s);

        if (c !== null) {
            s.cursor += 1;
        }

        return c;
    };

    htmlPair = function (pair) {
        var carObj, cdrObj, temp;

        carObj = car(pair);
        cdrObj = cdr(pair);

        temp = exports.html(carObj);

        if (cdrObj.type === "PAIR") {
            return temp + " " + htmlPair(cdrObj);
        }

        if (cdrObj.type === "THE_EMPTY_LIST") {
            return temp;
        }

        return temp + " . " + exports.html(cdrObj);
    };

    ifAlternative = function (exp) {
        if (isTheEmptyList(cdr(cdr(cdr(exp))))) {
            return lispF;
        }

        return car(cdr(cdr(cdr(exp))));
    };

    ifConsequent = function (exp) {
        return car(cdr(cdr(exp)));
    };

    ifPredicate = function (exp) {
        return car(cdr(exp));
    };

    init = function () {
        lispF = allocObject();
        lispF.type = "BOOLEAN";
        lispF.boolean = {
            value: 0
        };

        lispT = allocObject();
        lispT.type = "BOOLEAN";
        lispT.boolean = {
            value: 1
        };

        theEmptyList = allocObject();
        theEmptyList.type = "THE_EMPTY_LIST";

        symbolTable = {};

        defineSymbol = makeSymbol("define");
        ifSymbol = makeSymbol("if");
        lambdaSymbol = makeSymbol("lambda");
        okSymbol = makeSymbol("ok");
        quoteSymbol = makeSymbol("quote");
        setSymbol = makeSymbol("set!");

        theEmptyEnvironment = theEmptyList;
        exports.theGlobalEnvironment = setupEnvironment();

        addProcedure("null?", procIsNull);
        addProcedure("boolean?", procIsBoolean);
        addProcedure("symbol?", procIsSymbol);
        addProcedure("integer?", procIsInteger);
        addProcedure("char?", procIsChar);
        addProcedure("string?", procIsString);
        addProcedure("pair?", procIsPair);
        addProcedure("procedure?", procIsProcedure);

        addProcedure("char->integer", procCharToInteger);
        addProcedure("integer->char", procIntegerToChar);
        addProcedure("number->string", procNumberToString);
        addProcedure("string->number", procStringToNumber);
        addProcedure("symbol->string", procSymbolToString);
        addProcedure("string->symbol", procStringToSymbol);

        addProcedure("+", procAdd);
        addProcedure("-", procSub);
        addProcedure("*", procMul);
        addProcedure("quotient", procQuotient);
        addProcedure("remainder", procRemainder);
        addProcedure("=", procIsNumberEqual);
        addProcedure("<", procIsLessThan);
        addProcedure(">", procIsGreaterThan);

        addProcedure("cons", procCons);
        addProcedure("car", procCar);
        addProcedure("cdr", procCdr);
        addProcedure("set-car!", procSetCar);
        addProcedure("set-cdr!", procSetCdr);
        addProcedure("list", procList);

        addProcedure("eq?", procIsEq);
    };

    isAlpha = function (c) {
        var code;

        if (c === null) {
            return false;
        }

        code = c.charCodeAt(0);

        return (code > 96 && code < 123) || (code > 64 && code < 91);
    };

    isApplication = function (exp) {
        return isPair(exp);
    };

    isAssignment = function (exp) {
        return isTaggedList(exp, setSymbol);
    };

    isBoolean = function (obj) {
        return obj.type === "BOOLEAN";
    };

    isCharacter = function (obj) {
        return obj.type === "CHARACTER";
    };

    isCompoundProc = function (obj) {
        return obj.type === "COMPOUND_PROC";
    };

    isDefinition = function (exp) {
        return isTaggedList(exp, defineSymbol);
    };

    isDelimiter = function (c) {
        return isSpace(c) || c === null ||
            c === "(" || c === ")" ||
            c === "\"" || c === ";";
    };

    isDigit = function (c) {
        return c === "0" || c === "1" || c === "2" ||
            c === "3" || c === "4" || c === "5" ||
            c === "6" || c === "7" || c === "8" ||
            c === "9";
    };

    isFalse = function (obj) {
        return obj === lispF;
    };

    isFixnum = function (obj) {
        return obj.type === "FIXNUM";
    };

    isIf = function (exp) {
        return isTaggedList(exp, ifSymbol);
    };

    isInitial = function (c) {
        return isAlpha(c) || c === "*" || c === "/" || c === ">" ||
            c === "<" || c === "=" || c === "?" || c === "!";
    };

    isLambda = function (exp) {
        return isTaggedList(exp, lambdaSymbol);
    };

    isLastExp = function (seq) {
        return isTheEmptyList(cdr(seq));
    };

    isNoOperands = function (ops) {
        return isTheEmptyList(ops);
    };

    isPair = function (obj) {
        return obj.type === "PAIR";
    };

    isPrimitiveProc = function (obj) {
        return obj.type === "PRIMITIVE_PROC";
    };

    isQuoted = function (exp) {
        return isTaggedList(exp, quoteSymbol);
    };

    isSelfEvaluating = function (exp) {
        return isBoolean(exp) ||
            isFixnum(exp) ||
            isCharacter(exp) ||
            isString(exp);
    };

    isSpace = function (c) {
        return c === " " || c === "\n" || c === "\t";
    };

    isSpecial = function (sym) {
        return sym === defineSymbol ||
            sym === ifSymbol ||
            sym === quoteSymbol ||
            sym === setSymbol;
    };

    isString = function (obj) {
        return obj.type === "STRING";
    };

    isSymbol = function (obj) {
        return obj.type === "SYMBOL";
    };

    isTaggedList = function (exp, tag) {
        var theCar;

        if (isPair(exp)) {
            theCar = car(exp);
            return isSymbol(theCar) && theCar === tag;
        }

        return false;
    };

    isTheEmptyList = function (obj) {
        return obj.type === "THE_EMPTY_LIST";
    };

    isTrue = function (obj) {
        return !isFalse(obj);
    };

    isVariable = isSymbol;

    lambdaBody = function (exp) {
        return cdr(cdr(exp));
    };

    lambdaParamters = function (exp) {
        return car(cdr(exp));
    };

    listOfValues = function (exps, env) {
        if (isNoOperands(exps)) {
            return theEmptyList;
        }

        return cons(exports.eval(firstOperand(exps), env),
                    listOfValues(restOperands(exps), env));
    };

    lookupVariableValue = function (variable, env) {
        var frame, vars, vals;

        while (!isTheEmptyList(env)) {
            frame = firstFrame(env);
            vars = frameVariables(frame);
            vals = frameValues(frame);

            while (!isTheEmptyList(vars)) {
                if (variable === car(vars)) {
                    return car(vals);
                }

                vars = cdr(vars);
                vals = cdr(vals);
            }

            env = enclosingEnvironment(env);
        }

        throw("unbound variable");
    };

    makeCharacter = function (c) {
        var obj;

        obj = allocObject();
        obj.type = "CHARACTER";
        obj.character = {
            value: c
        };

        return obj;
    };

    makeCompoundProc = function (parameters, body, env) {
        var obj;

        obj = allocObject();
        obj.type = "COMPOUND_PROC";
        obj.compoundProc = {
            parameters: parameters,
            body: body,
            env: env
        };

        return obj;
    };

    makeFixnum = function (n) {
        var obj;

        obj = allocObject();
        obj.type = "FIXNUM";
        obj.fixnum = {
            value: n
        };

        return obj;
    };

    makeFrame = function (variables, values) {
        return cons(variables, values);
    };

    makeLambda = function (parameters, body) {
        return cons(lambdaSymbol, cons(parameters, body));
    };

    makePrimitiveProc = function (fn) {
        var obj;

        obj = allocObject();
        obj.type = "PRIMITIVE_PROC";
        obj.primitiveProc = {
            fn: fn
        };

        return obj;
    };

    makeSpan = function (cls, text) {
        return "<span class=\"lisp-" + cls + "\">" + text + "</span>";
    };

    makeString = function (str) {
        var obj;

        obj = allocObject();
        obj.type = "STRING";
        obj.string = {
            value: str
        };

        return obj;
    };

    makeSymbol = function (value) {
        var obj;

        if (symbolTable[value]) {
            return symbolTable[value];
        }

        obj = allocObject();
        obj.type = "SYMBOL";
        obj.symbol = {
            value: value
        };

        symbolTable[value] = obj;

        return obj;
    };

    operands = function (exp) {
        return cdr(exp);
    };

    operator = function (exp) {
        return car(exp);
    };

    peek = function (s) {
        if (s.cursor >= s.value.length) {
            return null;
        }

        return s.value.substring(s.cursor, s.cursor + 1);
    };

    peekExpectedDelimiter = function (s) {
        if (!isDelimiter(peek(s))) {
            throw("character not followed by delimiter");
        }
    };

    procAdd = function (args) {
        var result;

        result = 0;

        while (!isTheEmptyList(args)) {
            result = result + car(args).fixnum.value;
            args = cdr(args);
        }

        return makeFixnum(result);
    };

    procCar = function (args) {
        return car(car(args));
    };

    procCdr = function (args) {
        return cdr(car(args));
    };

    procCharToInteger = function (args) {
        return makeFixnum(car(args).character.value.charCodeAt(0));
    };

    procCons = function (args) {
        return cons(car(args), car(cdr(args)));
    };

    procIntegerToChar = function (args) {
        return makeCharacter(String.fromCharCode(car(args).fixnum.value));
    };

    procIsBoolean = function (args) {
        return isBoolean(car(args)) ? lispT : lispF;
    };

    procIsChar = function (args) {
        return isCharacter(car(args)) ? lispT : lispF;
    };

    procIsEq = function (args) {
        var obj1, obj2;

        obj1 = car(args);
        obj2 = car(cdr(args));

        if (obj1.type !== obj2.type) {
            return lispF;
        }

        switch (obj1.type) {
            case "FIXNUM":
            return obj1.fixnum.value === obj2.fixnum.value ? lispT : lispF;

            case "CHARACTER":
            return obj1.character.value === obj2.character.value ? lispT : lispF;

            case "STRING":
            return obj1.string.value === obj2.string.value ? lispT : lispF;

            default:
            return obj1 === obj2 ? lispT : lispF;
        }
    };

    procIsGreaterThan = function (args) {
        var next, previous;

        previous = car(args).fixnum.value;

        while (!isTheEmptyList(args = cdr(args))) {
            next = car(args).fixnum.value;

            if (previous > next) {
                previous = next;
            } else {
                return lispF;
            }
        }

        return lispT;
    };

    procIsInteger = function (args) {
        return isFixnum(car(args)) ? lispT : lispF;
    };

    procIsNull = function (args) {
        return isTheEmptyList(car(args)) ? lispT : lispF;
    };

    procIsLessThan = function (args) {
        var next, previous;

        previous = car(args).fixnum.value;

        while (!isTheEmptyList(args = cdr(args))) {
            next = car(args).fixnum.value;

            if (previous < next) {
                previous = next;
            } else {
                return lispF;
            }
        }

        return lispT;
    };

    procIsNumberEqual = function (args) {
        var value;

        value = car(args).fixnum.value;

        while (!isTheEmptyList(args = cdr(args))) {
            if (value !== car(args).fixnum.value) {
                return lispF;
            }
        }

        return lispT;
    };

    procIsPair = function (args) {
        return isPair(car(args)) ? lispT : lispF;
    };

    procIsProcedure = function (args) {
        return isPrimitiveProc(car(args)) ? lispT : lispF;
    };

    procIsString = function (args) {
        return isString(car(args)) ? lispT : lispF;
    };

    procIsSymbol = function (args) {
        return isSymbol(car(args)) ? lispT : lispF;
    };

    procList = function (args) {
        return args;
    };

    procMul = function (args) {
        var result;

        result = 1;

        while (!isTheEmptyList(args)) {
            result = result * car(args).fixnum.value;
            args = cdr(args);
        }

        return makeFixnum(result);
    };

    procNumberToString = function (args) {
        return makeString(car(args).fixnum.value.toString());
    };

    procQuotient = function (args) {
        return makeFixnum(car(args).fixnum.value /
                          car(cdr(args)).fixnum.value);
    };

    procRemainder = function (args) {
        return makeFixnum(car(args).fixnum.value %
                          car(cdr(args)).fixnum.value);
    };

    procSetCar = function (args) {
        setCar(car(args), car(cdr(args)));

        return okSymbol;
    };

    procSetCdr = function (args) {
        setCdr(car(args), car(cdr(args)));

        return okSymbol;
    };

    procStringToNumber = function (args) {
        return makeFixnum(parseInt(car(args).string.value, 10));
    };

    procSymbolToString = function (args) {
        return makeString(car(args).symbol.value);
    };

    procStringToSymbol = function (args) {
        return makeSymbol(car(args).string.value);
    };

    procSub = function (args) {
        var result;

        result = car(args).fixnum.value;

        while (!isTheEmptyList(args = cdr(args))) {
            result = result - car(args).fixnum.value;
        }

        return makeFixnum(result);
    };

    readCharacter = function (s) {
        var c;

        c = getc(s);

        switch (c) {
            case null:
            throw("incompete character literal");

            case "s":
            if (peek(s) === "p") {
                eatExpectedString(s, "pace");
                peekExpectedDelimiter(s);

                return makeCharacter(" ");
            }

            break;

            case "n":
            if (peek(s) === "e") {
                eatExpectedString(s, "ewline");
                peekExpectedDelimiter(s);

                return makeCharacter("\n");
            }

            break;
        }

        peekExpectedDelimiter(s);
        return makeCharacter(c);
    };

    readPair = function (s) {
        var c, carObj, cdrObj;

        eatWhitespace(s);
        c = getc(s);

        if (c === ")") {
            // read the empty list
            return theEmptyList;
        }

        ungetc(s);
        carObj = exports.read(s);
        eatWhitespace(s);
        c = getc(s);

        if (c === ".") {
            // read improper list
            c = peek(s);

            if (!isDelimiter(c)) {
                throw("dot not followed by delimiter");
            }

            cdrObj = exports.read(s);
            eatWhitespace(s);
            c = getc(s);

            if (c !== ")") {
                throw("where was the trailing paren?");
            }

            return cons(carObj, cdrObj);
        }

        // read list
        ungetc(s);
        cdrObj = readPair(s);

        return cons(carObj, cdrObj);
    };

    restExps = function (seq) {
        return cdr(seq);
    };

    restOperands = function (ops) {
        return cdr(ops);
    };

    setCar = function (obj, value) {
        obj.pair.car = value;
    };

    setCdr = function (obj, value) {
        obj.pair.cdr = value;
    };

    setupEnvironment = function () {
        return extendEnvironment(theEmptyList,
                                 theEmptyList,
                                 theEmptyEnvironment);
    };

    setVariableValue = function (variable, val, env) {
        var frame, vars, vals;

        while (!isTheEmptyList(env)) {
            frame = firstFrame(env);
            vars = frameVariables(frame);
            vals = frameValues(frame);

            while (!isTheEmptyList(vars)) {
                if (variable === car(vars)) {
                    setCar(vals, val);

                    return;
                }

                vars = cdr(vars);
                vals = cdr(vals);
            }

            env = enclosingEnvironment(env);
        }

        throw("unbound variable");
    };

    textOfQuotation = function (exp) {
        return car(cdr(exp));
    };

    ungetc = function (s) {
        if (s.cursor === 0) {
            return;
        }

        s.cursor -= 1;
    };

    writePair = function (pair) {
        var carObj, cdrObj, temp;

        carObj = car(pair);
        cdrObj = cdr(pair);

        temp = exports.write(carObj);

        if (cdrObj.type === "PAIR") {
            return temp + " " + writePair(cdrObj);
        }

        if (cdrObj.type === "THE_EMPTY_LIST") {
            return temp;
        }

        return temp + " . " + exports.write(cdrObj);
    };

    exports.eval = function (exp, env) {
        var args, procedure;
        while (true) {
            if (isSelfEvaluating(exp)) {
                return exp;
            }

            if (isVariable(exp)) {
                return lookupVariableValue(exp, env);
            }

            if (isQuoted(exp)) {
                return textOfQuotation(exp);
            }

            if (isAssignment(exp)) {
                return evalAssignment(exp, env);
            }

            if (isDefinition(exp)) {
                return evalDefinition(exp, env);
            }

            if (isIf(exp)) {
                exp = isTrue(exports.eval(ifPredicate(exp), env)) ?
                    ifConsequent(exp) :
                    ifAlternative(exp);

                continue;
            }

            if (isLambda(exp)) {
                return makeCompoundProc(lambdaParamters(exp),
                                        lambdaBody(exp),
                                        env);
            }

            if (isApplication(exp)) {
                procedure = exports.eval(operator(exp), env);
                args = listOfValues(operands(exp), env);

                if (isPrimitiveProc(procedure)) {
                    return procedure.primitiveProc.fn(args);
                }

                if (isCompoundProc(procedure)) {
                    env = extendEnvironment(procedure.compoundProc.parameters,
                                            args,
                                            procedure.compoundProc.env);

                    exp = procedure.compoundProc.body;

                    while (!isLastExp(exp)) {
                        exports.eval(firstExp(exp), env);
                        exp = restExps(exp);
                    }

                    exp = firstExp(exp);
                    continue;
                }

                throw("unknown procedure type");
            }

            throw("cannot eval unknown expression type");
        }
    };

    exports.html = function (obj) {
        var cls, text;

        if (obj.type === "PAIR") {
            return makeSpan("paren", "(") + htmlPair(obj) + makeSpan("paren", ")");
        } else {
            text = exports.write(obj);

            switch (obj.type) {
            case "BOOLEAN":
                cls = "bool";

                break;

            case "CHARACTER":
                cls = "char";

                break;

            case "FIXNUM":
                cls = "nr";

                break;

            case "PRIMITIVE_PROC":
                cls = "prim";

                text = "#&lt;procedure&gt;";

                break;

            case "STRING":
                cls = "str";

                break;

            case "SYMBOL":
                cls = isSpecial(obj) ? "special" : "sym";

                break;

            case "THE_EMPTY_LIST":
                cls = "paren";

                break;

            default:
                throw("cannot write unknown type");
            }

            return makeSpan(cls, text);
        }
    };

    exports.makeStream = function (s) {
        return {
            value: s,
            cursor: 0
        };
    };

    exports.read = function (s) {
        var c, i, token;

        eatWhitespace(s);

        c = getc(s);

        if (c === "#") {
            c = getc(s);

            switch (c) {
                case "t":
                return lispT;

                case "f":
                return lispF;

                case "\\":
                return readCharacter(s);

                default:
                throw("unknown boolean or character literal");
            }
        }

        if (isDigit(c) || c === "-" && isDigit(peek(s))) {
            token = c;

            while (isDigit(c = getc(s))) {
                token = token + c;
            }

            if (isDelimiter(c)) {
                ungetc(s);

                return makeFixnum(parseInt(token, 10));
            }

            throw("number not followed by delimiter");
        }

        if (isInitial(c) || ((c === "+" || c === "-") && isDelimiter(peek(s)))) {
            i = 0;
            token = "";

            while (isInitial(c) || isDigit(c) || c === "+" || c === "-") {
                if (i < bufferMax) {
                    token = token + c;
                    i = i + 1;
                } else {
                    throw("symbol too long. Maximum length is " + bufferMax);
                }

                c = getc(s);
            }

            if (isDelimiter(c)) {
                ungetc(s);
                return makeSymbol(token);
            }

            throw("symbol not followed by delimiter. Found '" + c + "'");
        }

        if (c === "\"") {
            i = 0;
            token = "";

            while ((c = getc(s)) !== "\"") {
                if (c === "\\") {
                    c = getc(s);

                    if (c === "n") {
                        c = "\n";
                    }
                }

                if (c === null) {
                    throw("non-terminated string literal");
                }

                if (i < bufferMax) {
                    token = token + c;
                    i = i + 1;
                } else {
                    throw("string too long. Maximum length is " + bufferMax);
                }
            }

            return makeString(token);
        }

        if (c === "(") {
            return readPair(s);
        }

        if (c === "'") {
            return cons(quoteSymbol, cons(exports.read(s), theEmptyList));
        }

        throw("bad input. Unexpected '" + c + "'");
    };

    exports.write = function (obj) {
        var c, i, len, str, token;

        switch (obj.type) {
        case "BOOLEAN":
            return "#" + (isFalse(obj) ? "f" : "t");

        case "CHARACTER":
            c = obj.character.value;

            switch (c) {
                case "\n":
                token = "newline";
                break;

                case " ":
                token = "space";
                break;

                default:
                token = c;
            }

            return "#\\" + token;

        case "FIXNUM":
            return obj.fixnum.value + "";

        case "PAIR":
            return "(" + writePair(obj) + ")";

        case "COMPOUND_PROC":
        case "PRIMITIVE_PROC":
            return "#<procedure>";

        case "STRING":
            token = "";
            str = obj.string.value;
            len = str.length;

            for (i = 0; i < len; i++) {
                c = str.substring(i, i + 1);

                switch (c) {
                    case "\n":
                    token = token + "\\n";
                    break;

                    case "\\":
                    token = token + "\\\\";
                    break;

                    case "\"":
                    token = token + "\\\"";
                    break;

                    default:
                    token = token + c;
                }
            }

            return "\"" + token + "\"";

        case "SYMBOL":
            return obj.symbol.value;

        case "THE_EMPTY_LIST":
            return "()";

        default:
            throw("cannot write unknown type");
        }
    };

    init();
})(window.lisp = window.lisp || {});
