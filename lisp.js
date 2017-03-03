(function (exports) {
    var allocObject, available, eatWhitespace, getc, init, isDelimiter, isDigit, isSpace, makeFixnum, peek, ungetc;

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

    isSpace = function (c) {
        return c === " " || c === "\n" || c === "\t";
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

        switch (obj.type) {
        case "FIXNUM":
            cls = "nr";
            text = obj.fixnum.value + "";

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
        case "FIXNUM":
            return obj.fixnum.value + "";
        default:
            throw("cannot write unknown type");
        }
    };

    init();
})(window.lisp = window.lisp || {});
