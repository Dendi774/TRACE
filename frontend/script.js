
document.addEventListener("DOMContentLoaded", function () {

    const today = new Date();

    const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    };

    const dateElement = document.getElementById("current-date");

    if (dateElement) {
        dateElement.innerHTML = today.toLocaleDateString("en-US", options);
    } else {
        console.error("Date element not found!");
    }

    const logoutButton = document.querySelector(".logout");

    if (logoutButton) {
        logoutButton.addEventListener("click", function(event) {
            const confirmAction = confirm("Are you sure you want to log out?");

            if (!confirmAction) {
                event.preventDefault();
            }
        });
    }

});
