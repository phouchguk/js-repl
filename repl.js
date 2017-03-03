(function () {
    var prompt, ta;

    prompt = document.getElementById("prompt");
    ta = document.getElementById("lisp-input");

    ta.addEventListener("keypress", function (e) {
        var result;

        if (e.keyCode === 13) {
            e.preventDefault();

            // if the user pressed enter, try and read
            try {
                result = lisp.read(ta.value);

                prompt.insertAdjacentHTML("beforebegin",
                                          "<span>&gt;&nbsp;" +
                                          result +
                                          "</span><br><span>" +
                                          result +
                                          "</span><br>")

                // presume successful read
                ta.value = "";
            } catch (err) {
                // do nothing
            }
        }
    });

    ta.focus();
})();
