function sendDonorForm() {
    var url = "https://ebd.mybluemix.net/api/register/donor";
    var formElement = document.querySelector("form");
    var request = new XMLHttpRequest();
    request.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            var response = JSON.parse(this.responseText);
            goToDash(response);
        }
    }
    request.open("POST", url);
    request.send(new FormData(formElement));
};

function goToDash(response) {
    if (response.success == "true") {
        window.location.href = "https://ebd.mybluemix.net/dashboard";
    }
};

function sendHospitalForm() {
    var url = "https://ebd.mybluemix.net/api/register/hospital";
    var formElement = document.querySelector("form");
    var request = new XMLHttpRequest();
    request.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            var response = JSON.parse(this.responseText);
            goToDash(response);
        }
    }
    request.open("POST", url);
    request.send(new FormData(formElement));
};