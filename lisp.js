(function (exports) {
    var addBindingToFrame, allocObject, assignmentValue, assignmentVariable, bufferMax, car, cdr, cons, defineSymbol, defineVariable, definitionValue, definitionVariable, eatExpectedString, eatWhitespace, enclosingEnvironment, evalAssignment, evalDefinition, extendEnvironment, firstFrame, frameValues, frameVariables, getc, htmlPair, init, isAlpha, isAssignment, isBoolean, isCharacter, isDefinition, isDelimiter, isDigit, isFalse, isFixnum, isInitial, isPair, isQuoted, isSelfEvaluating, isSpace, isSpecial, isString, isSymbol, isTaggedList, isTheEmptyList, isTrue, isVariable, lispF, lispT, lookupVariableValue, makeCharacter, makeFixnum, makeFrame, makeSpan, makeString, makeSymbol, okSymbol, peek, peekExpectedDelimiter, quoteSymbol, readCharacter, readPair, setSymbol, setCar, setCdr, setupEnvironment, setVariableValue, symbolTable, textOfQuotation, theEmptyEnvironment, theEmptyList, ungetc, writePair;

    addBindingToFrame = function (variable, value, frame) {
        setCar(frame, cons(variable, car(frame)));
        setCdr(frame, cons(value, cdr(frame)));
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
        return car(cdr(cdr(exp)));
    };

    definitionVariable = function (exp) {
        return car(cdr(exp));
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

    firstFrame = function (env) {
        return car(env);
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
        okSymbol = makeSymbol("ok");
        quoteSymbol = makeSymbol("quote");
        setSymbol = makeSymbol("set!");

        theEmptyEnvironment = theEmptyList;
        exports.theGlobalEnvironment = setupEnvironment();
    };

    isAlpha = function (c) {
        var code;

        if (c === null) {
            return false;
        }

        code = c.charCodeAt(0);

        return (code > 96 && code < 123) || (code > 64 && code < 91);
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

    isInitial = function (c) {
        return isAlpha(c) || c === "*" || c === "/" || c === ">" ||
            c === "<" || c === "=" || c === "?" || c === "!";
    };

    isPair = function (obj) {
        return obj.type === "PAIR";
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

        throw("cannot eval unknown expression type");
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
