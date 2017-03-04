(function (exports) {
    var allocObject, available, bufferMax, eatExpectedString, eatWhitespace, getc, init, isBoolean, isCharacter, isDelimiter, isDigit, isFalse, isSpace, isString, isTrue, lispF, lispT, makeCharacter, makeFixnum, makeString, peek, peekExpectedDelimiter, readCharacter, ungetc;

    allocObject = function () {
        if (available.length === 0) {
            throw("out of memory");
        }

        return available.pop();
    };

    bufferMax = 1000;

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

    getc = function (s) {
        var c;

        c = peek(s);

        if (c !== null) {
            s.cursor += 1;
        }

        return c;
    };

    init = function () {
        var i;

        available = [];

        for (i = 0; i < 10; i++) {
            available.push({ type: "BLANK" });
        }

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
    };

    isBoolean = function (obj) {
        return obj.type === "BOOLEAN";
    };

    isCharacter = function (obj) {
        return obj.type === "CHARACTER";
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

    isSpace = function (c) {
        return c === " " || c === "\n" || c === "\t";
    };

    isString = function (obj) {
        return obj.type === "STRING";
    };

    isTrue = function (obj) {
        return !isFalse(obj);
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

    makeString = function (str) {
        var obj;

        obj = allocObject();
        obj.type = "STRING";
        obj.string = {
            value: str
        };

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

    ungetc = function (s) {
        if (s.cursor === 0) {
            return;
        }

        s.cursor -= 1;
    };

    exports.eval = function (exp) {
        return exp;
    };

    exports.html = function (obj) {
        var cls, text;

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

        default:
            throw("cannot write unknown type");
        }

        return "<span class=\"lisp-" + cls + "\">" + text + "</span>";
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

        default:
            throw("cannot write unknown type");
        }
    };

    init();
})(window.lisp = window.lisp || {});
