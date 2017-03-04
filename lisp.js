(function (exports) {
    var allocObject, available, eatWhitespace, getc, init, isBoolean, isDelimiter, isDigit, isFalse, isSpace, isTrue, lispF, lispT, makeFixnum, peek, ungetc;

    allocObject = function () {
        if (available.length === 0) {
            throw("out of memory");
        }

        return available.pop();
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

    isTrue = function (obj) {
        return !isFalse(obj);
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

    peek = function (s) {
        if (s.cursor >= s.value.length) {
            return null;
        }

        return s.value.substring(s.cursor, s.cursor + 1);
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
        case "FIXNUM":
            cls = "nr";

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
        var c, token;

        eatWhitespace(s);

        c = getc(s);

        if (c === "#") {
            c = getc(s);

            switch (c) {
                case "t":
                return lispT;

                case "f":
                return lispF;

                default:
                throw("unknown boolean literal");
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

        throw("bad input. Unexpected '" + c + "'");
    };

    exports.write = function (obj) {
        switch (obj.type) {
        case "BOOLEAN":
            return "#" + (isFalse(obj) ? "f" : "t");
        case "FIXNUM":
            return obj.fixnum.value + "";
        default:
            throw("cannot write unknown type");
        }
    };

    init();
})(window.lisp = window.lisp || {});
