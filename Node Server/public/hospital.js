function sendDonorForm() {
    var url = "https://ebd.mybluemix.net/api/register/donor";
    var formElement = document.querySelector("form");
    var request = new XMLHttpRequest();
    request.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            var response = JSON.parse(this.responseText);
            goToDonorDash(response);
        } else if (this.readyState == 4 && this.status != 200) {
            alert("unable to register donor");
        }
    }
    request.open("POST", url);
    request.send(new FormData(formElement));
};

function sendHospitalForm() {
    var url = "https://ebd.mybluemix.net/api/register/hospital";
    var formElement = document.querySelector("form");
    var request = new XMLHttpRequest();
    request.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            var response = JSON.parse(this.responseText);
            goToHospitalDash(response);
        } else if (this.readyState == 4 && this.status != 200) {
            alert("unable to register hospital");
        }
    }
    request.open("POST", url);
    request.send(new FormData(formElement));
};

function goToDonorDash(response) {
    if (response.success) {
        window.location.href = "https://ebd.mybluemix.net/donor-dash.html";
    } 
};

function goToHospitalDash(response) {
    if (response.success) {
        window.location.href = "https://ebd.mybluemix.net/hosp-dash.html";
    } 
};

function login() {
    var url = "https://ebd.mybluemix.net/api/login";
    var formElement = document.querySelector("form");
    var request = new XMLHttpRequest();
    request.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            var response = JSON.parse(this.responseText);
            dashFromLogin(response);
        } else if (this.readyState == 4 && this.status != 200) {
            alert("unable to log in");
        }
    }
    request.open("POST", url);
    request.send(new FormData(formElement));
}

function dashFromLogin(response) {
    if (response.success != null && response.success !== undefined) {
        var url = "https://ebd.mybluemix.net/api/donors/" + response.success;
        var request = new XMLHttpRequest();
        request.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                var resp = JSON.parse(this.responseText);
                if (resp.classification == "hospital") {
                    window.location.href = "https://ebd.mybluemix.net/hosp-dash.html";
                } else {
                    window.location.href = "https://ebd.mybluemix.net/donor-dash.html";
                }
            } else if (this.readyState == 4 && this.status != 200) {
                alert("unable to go to dash");
            }
        }
        request.open("GET", url);
        request.send();
    }
}


