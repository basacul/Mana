document.querySelector("#description").addEventListener("click", function () {
    if (this.innerHTML === "SHOW DESCRIPTION") {
        this.innerHTML = "HIDE DESCRIPTION";
        document.querySelector("#assignment").classList.toggle("hide");
    } else {
        this.innerHTML = "SHOW DESCRIPTION";
        document.querySelector("#assignment").classList.toggle("hide");
    }
});