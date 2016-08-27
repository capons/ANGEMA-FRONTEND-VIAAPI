// JavaScript Document
var access_token = "Bearer " + sessionStorage.getItem("access_token");
var refresh_token = "Bearer " + sessionStorage.getItem("refresh_token");
//var remote_url = "http://engena.co.za/api/";
var remote_url ="http://php_api.55/api/";
var msg = "";

var return_base_url = "http://web_login.45/index.html"; //reset password return URL (localhost testing)
//var return_base_url = "http://m.engena.co.za/index.html"; //reset password return URL

var paymentArray = [];
var ridersPhotoArray = {};
var checkout;

$(document).ready(function () {
    closeModal();
});

hello.init({
    facebook: '888700231243522',
    google: '56462872805-a29g0b89i6t6m31kgq6ilvgvmoro04rg.apps.googleusercontent.com',
    strava: '12287',
});

function check_session() {
    if (!sessionStorage.getItem("access_token")) {
        sessionStorage.setItem("message_flag", "Please Login to get access to this page....  ");
        location.href = "login.html";
    }
}

function load_profile_Data() {


    $.ajax({
        type: "GET",
        contentType: "application/json;charset=utf-8",
        accept: "application/json",
        dataType: "json",
        url: remote_url + "user?include=daypasses,favorites,socialAccounts",
        //url: "http://php_api.55/api/user?include=daypasses,favorites,socialAccounts",
        headers: {"Authorization": access_token},
        beforeSend: function () {
            openModal();
        },

        complete: function () {
            closeModal();
        },

        success: function (result) {

            var user = result;
            $("#name_span").html(user.firstName + " " + user.surName);
            $("#email_span").html(user.email);
            $("#contact_span").html("+" + user.mobile);
            $("#profilepic").attr("src", user.photoUrl);

            //..... Edit profile block
            $("#profile_name").val(user.firstName + " " + user.surName);
            $("#edit_email").val(user.email);
            $("#contactno").val(user.mobile);

            if (user.photoUrl == null) {
                $("#profilepic1").attr("src", "images/profile_pic88.jpg");
                $("#profilepic").attr("src", "images/profile_pic99.jpg");
            }
            else {
                $("#profilepic1").attr("src", user.photos.medium);
                $("#profilepic").attr("src", user.photos.small);
            }

            var favst = "";
            for (var key in user['favorites']) {
                favst += "<option value=" + user['favorites'][key]['reserveId'] + ">" + user['favorites'][key]['reserveName'] + "</option>";
            }

            dayPasses = user['daypasses']['data'];
            for (var key in dayPasses) {
                ridersPhotoArray[dayPasses[key]['passId']] = dayPasses[key]['photos']['medium'];
            }
            socialAccounts = user.socialAccounts.data;
            for (var key in socialAccounts) {
                if (socialAccounts[key]['provider'] === 'strava') {
                    Vue.set(vueSocial.accounts, 'strava', socialAccounts[key]);
                }
            }
            //get all regions
            getRegions();
            //get all Reserves
            getReserves(localStorage.getItem("region"));
            //get trails for reserve selected in session
            // getTrails(localStorage.getItem("reserve"));
            //get Costs for reserve selected in session
            // getCosts(localStorage.getItem("reserve"));
            //get payment history for current logged in user
            payment_history();
            //display payemnt history current logged in user
            // reder_payment_history();
            // reder_payment_made();
            //get list of passes having missing photos
            get_missing_photo('missing');
            closeModal();
        },
        error: function (jqXHR) {
            closeModal();
            if (jqXHR.status == 401) {
                if (access_token != '') {
                    RefreshToken(load_profile_Data);
                }
            }
        }
    });
}



//form validation
(function($,W,D)
{
    var JQUERY4U = {};

    JQUERY4U.UTIL =
    {
        setupFormValidation: function()
        {
            //form validation rules
            $("#edit_profile").validate({  //validation ruls -> form #edit_profile

                rules: {
                    profile_name: {
                        required: true
                    },

                    edit_email: {
                        required: true,
                        email: true
                    },
                    contactno: {
                        required: true
                    },
                    new_pass: {
                        required:false
                    },
                    conf_pass: {
                        required:false,
                        equalTo : "#new_pass"
                    }

                },
                messages: {
                    profile_name: "Please enter your name",
                    edit_email: "Please enter your email",
                    contactno: "Please enter you contact number",
                    conf_pass: "Does not match the password field"
                },
                submitHandler: function(form) {

                    edit_profile_Data();   //submit edit profile form

                }
            });
        }
    }

    //when the dom has loaded setup form validation rules
    $(D).ready(function($) {
        JQUERY4U.UTIL.setupFormValidation();
    });

})(jQuery, window, document);




//edit page

function edit_profile_Data() {
    var new_pass = $("#new_pass").val();
    var confirm_pass = $("#conf_pass").val();

   // if ($("#edit_profile").valid()) {

        var name = document.getElementById("profile_name").value;
        name.trim();
        var name1 = name.split(" ");
        var firstname = name1[0];
        var surname = name1[1];

        var jsonData = {
            "firstname": firstname,
            "surname": surname,
            "email": document.getElementById("edit_email").value,
            "mobile": document.getElementById("contactno").value,
            "password": new_pass,
            "confirm": confirm_pass

        };

        $.ajax({
            type: "PUT",
            contentType: "application/json;charset=utf-8",
            accept: "application/json",
            async: true,
            crossDomain: true,
            dataType: "json",
            data: JSON.stringify(jsonData),
            url: remote_url + "user",
            //url:"http://php_api.55/api/user",
            headers: {"Authorization": access_token},
            beforeSend: function () {
                openModal();
            },

            complete: function () {
                closeModal();
            },
            success: function (result, status, jqXHR) {


                if (jqXHR.status == 200) location.href = "myprofile.html";
            },
            error: function (jqXHR) {

                sessionStorage.setItem('profile_update_m','Profile is not updated');
                    if (jqXHR.status == 200)

                             location.href = "myprofile.html";

                    else if (jqXHR.status == 401) {
                        if (access_token != '') {
                            RefreshToken(edit_profile_Data);
                        }
                    }






            }
        });
   // }
}


function load_photo() {
    if ($("#photo_form").valid()) {
        var form = new FormData();

        var files = $("#profile_photo").get(0).files;
        form.append("filename", files[0]);

        $.ajax({
            "async": true,
            "crossDomain": true,
            "url": remote_url + "user/photo",
            "method": "POST",
            "headers": {
                "Authorization": access_token,
                "cache-control": "no-cache"
            },
            "processData": false,
            "contentType": false,
            "mimeType": "multipart/form-data",
            "data": form,
            "beforeSend": function () {
                openModal();
            },

            complete: function () {
                closeModal();
            },
            "success": function (result, status, jqXHR) {
                if (jqXHR.status == 200) location.href = "myprofile.html";
            },
            "error": function (jqXHR, status) {

                if (jqXHR.status == 200) location.href = "myprofile.html";
                else if (jqXHR.status == 401) {
                    if (access_token != '') {
                        RefreshToken(load_photo);
                    }
                }
            }
        });
    }
}

function signup() {
    if ($("#registration").valid()) {
        var contact_no = $("#contactno").val();
        //alert("contact no: "+contact_no);

        var jsonData =
        {
            "userName": $("#username").val(),
            "password": $("#password").val(),
            "confirmPassword": $("#c_password").val(),
            "firstname": $("#fname").val(),
            "surname": $("#lname").val(),
            "mobile": contact_no,
            "email": $("#email").val(),
            "distance":"25",
            "units": "0"
        }
        $.ajax({
            "type": "POST",
            "contentType": "application/json;charset=utf-8",
            "accept": "application/json",
            "url": remote_url + "auth/register",
            "data": JSON.stringify(jsonData),
            "beforeSend": function () {
                openModal();
            },

            complete: function () {
                closeModal();
            },
            "success": function (result) {
                sessionStorage.setItem("message_flag", "User Registered Successfully, Proceed with Login....");
                location.href = "login.html";
            },
            "error": function (result) {
                closeModal();
                var str = "";
                for (var key in result["responseJSON"]["modelState"]) {
                    var len1 = 0;
                    for (var key1 in result["responseJSON"]["modelState"][key]) {
                        var len = result["responseJSON"]["modelState"][key].length;
                        if (len1 < len / 2) {
                            str += "- ";
                            str += result["responseJSON"]["modelState"][key][key1];
                            str += "</br>";
                            len1++;
                        }
                    }
                }
                $("#error_span").html(str);
            }
        });
    }
}

function display_msg() {
    var signup_flag = sessionStorage.getItem("message_flag");
    if (signup_flag != '') $(".msg").html(signup_flag);
    sessionStorage.removeItem("message_flag");
    sessionStorage.removeItem("access_token");
}

function login() {
    if ($("#login_frm").valid()) {
        var remember_me = $("#remember_me").prop("checked");
        $.ajax({
            "async": true,
            "crossDomain": true,
            "url": remote_url + "auth/login",
            //"url": "http://php_api.55/api/auth/login",
            "type": "POST",
            "data": {
                "username": $("#username").val(),
                "password": $("#password").val(),
                "grant_type": "password",
                "client_id": "engenaOpen"
            },


            "beforeSend": function () {
                openModal();
            },

            "complete": function () {
                closeModal();
            },
            "success": function (result) {
                if (result.token != '') {

                    sessionStorage.setItem("access_token", result.token);
                    sessionStorage.setItem("refresh_token", result.token);
                    localStorage.setItem("remember_me", remember_me);
                    location.href = "myprofile.html";
                }


            },
            "error": function (result) {

                closeModal();
                var str = "";
                str += "- ";
                str += result["responseJSON"]["message"];
                str += "</br>";
                $("#error_span").html(str);
            }
        });
    }
}


function reset_pass(){
    if ($("#reset_p_frm").valid()) {
        //var remember_me = $("#remember_me").prop("checked");
        $.ajax({
            "async": true,
            "crossDomain": true,
            "url": remote_url + "auth/forgotpassword",
            //"url": "http://php_api.55/api/auth/forgotpassword",
            "type": "POST",
            "data": {
                "email": $("#useremail").val(),
                "return_url": return_base_url,
                //"password": $("#password").val(),
                //"grant_type": "password",
                "client_id": "engenaOpen"
            },
            "beforeSend": function () {
                openModal();
            },
            "complete": function () {
                closeModal();
            },
            "success": function (result) {

                sessionStorage.setItem("reset_email", result.info);
                location.href = return_base_url;
               // console.log(result);
                /*

                if (result.token != '') {

                    sessionStorage.setItem("access_token", result.token);
                    sessionStorage.setItem("refresh_token", result.token);
                    //localStorage.setItem("remember_me", remember_me);
                    location.href = "myprofile.html";
                }
                */
            },
            "error": function (result) {

                closeModal();
                var str = "";
                str += "- ";
                str += result["responseJSON"]["message"];
                str += "</br>";
                $("#error_span").html(str);
            }
        });
    }
}

function socialLogin(provider) {
    hello(provider).login({ scope: 'email'}).then(function(response) {
        var accessToken =  response.authResponse.access_token
        saveSocialLogin(provider, accessToken);
    }, function(e) {
        console.log('Signin error: ' + e.error.message);
    });
    return false;
};

function saveSocialLogin(socialProvider, socialAcessToken) {

    openModal();
    $.ajax({
        "url": remote_url + "auth/" + socialProvider,
        "type": "POST",
        "data": {
            "accessToken": socialAcessToken,
        },
        "success": function (result) {
            if (result.token != '') {
                sessionStorage.setItem("access_token", result.token);
                location.href = "myprofile.html";
                closeModal();
            }
        },
        "error": function (result) {
            closeModal();
            var str = "- " + result["responseJSON"]["error_description"] + "</br>";
            $("#error_span").html(str);
        }
    });
}

function socialConnect(provider) {
    hello(provider).login({ scope: 'email'}).then(function(response) {
        var accessToken =  response.authResponse.access_token
        linkSocialAccount(provider, accessToken);
    }, function(e) {
        console.log('Social Connect error: ' + e.error.message);
    });
    return false;
};

function linkSocialAccount(socialProvider, socialAcessToken) {

    openModal();
    $.ajax({
        "url": remote_url + "connect/" + socialProvider,
        "type": "POST",
        "data": {"accessToken": socialAcessToken},
        headers: {"Authorization": access_token},
        "success": function (result) {
            if (result.status == 'success') {
                closeModal();
                Vue.delete(vueSocial.accounts, 'error');
                Vue.set(vueSocial.accounts, socialProvider, result.data.account);

            }
        },
        "error": function (result) {
            closeModal();
            Vue.set(vueSocial.accounts, 'error', result.responseJSON.message);
        }
    });
}

function RefreshToken(CallingMethod) {

    $.ajax({
        type: "POST",
        datatype: "json",
        url: remote_url + "auth/login",
        data: {'grant_type': 'refresh_token', 'client_id': 'engena', 'refresh_token': refresh_token},
        success: function (result) {
            sessionStorage.setItem("access_token", result['access_token']);
            sessionStorage.setItem("refresh_token", result['refresh_token']);
            CallingMethod();
        },
        error: function (result) {
            location.href = "login.html";
        }
    });
}

function openModal() {
    document.getElementById('modalx').style.display = 'block';
    document.getElementById('fadex').style.display = 'block';
}

function closeModal() {
    document.getElementById('modalx').style.display = 'none';
    document.getElementById('fadex').style.display = 'none';
}

function getRegions() {
    // localStorage.setItem("region", 1);
    $.ajax({
        "async": true,
        "crossDomain": true,
        "url": remote_url + "regions",
        "type": "GET",
        headers: {"Authorization": access_token},
        "success": function (result) {

            var str = "<option value=''>Select Region</option>";

            for (var key in result.data) {
                var sel = '';
                if (result.data[key]['regionId'] == localStorage.getItem("region")) {
                    sel = " selected='selected'";
                }
                var regionID = result.data[key]['regionId'];
                var region = result.data[key]['region'];
                str += "<option value=" + regionID + " " + sel + ">" + region + "</option>";
            }
            $('#where_Town').html(str);

        }
    });

}

function getActivities() {
    $.ajax({
        "async": true,
        "crossDomain": true,
        "url": remote_url + "activities",
        "type": "GET",
        "success": function (result) {

            str = "<option value=''>Select Ride</option>";

            for (var key in result) {
                str += "<option value=" + result[key]['activityId'] + ">" + result[key]['activity'] + "</option>";
            }
            $('#where_Activity').html(str);
        }
    });

}

function getReserves() {
    var region = '';
    $('#dataTabx').html("");
    $('.datetab').hide();

    if ($("#where_Town").val()) {
        region = $("#where_Town").val();
    } else {
        region = localStorage.getItem("region");
    }

    var surl = remote_url + "reserves";
    if (region) {
        localStorage.setItem("region", region);
        $("#regionerror").html("");
        surl += "?region=" + region;
        var activity = $("#where_Activity").val();
        if (activity != "") surl += "&activity=" + activity;
        $.ajax({
            "async": true,
            "crossDomain": true,
            "url": surl,
            "type": "GET",
            headers: {"Authorization": access_token},
            "success": function (result) {

                if(result.data.length <= 0) {
                    var str = "<option value=''>No Reserves</option>";
                    $('#where_Trail').html(str);
                    return false;
                }

                var str = "<option value=''>Select Reserve</option>";
                var sel = "";
                for (var key in result.data) {
                    sel = "";
                    if (result.data[key]['reserveId'] == localStorage.getItem("reserve")) {
                        sel = " selected='selected'";
                        getCosts(localStorage.getItem("reserve"));
                        // getTrails(localStorage.getItem("reserve"));
                    }
                    str += "<option value=" + result.data[key]['reserveId'] + " " + sel + ">" + result.data[key]['reserveName'] + "</option>";
                }
                $('#where_Trail').html(str);

            }
        });
    } else {
        $("#regionerror").html("Please select region");
    }
}

function getCosts(reserveID) {

    $('#dataTabx').html("");
    if (! reserveID) {
        updateTrailsList([]);
        return false;
    }

    if ($("#where_Town").val()) region = $("#where_Town").val();
    else var region = localStorage.getItem("region");

    var surl = remote_url + "reserves/" + reserveID + "?include=trails";
    if (region) {
        $("#regionerror").html("");
        // surl += "region/" + region;
        // var activity = $("#where_Activity").val();
        // if (activity != "") surl += "/activity/" + activity;
        $.ajax({
            "async": true,
            "crossDomain": true,
            "url": surl,
            "type": "GET",
            headers: {"Authorization": access_token},
            "success": function (result) {
                str = "";
                // for (var key in result) {
                    if (result.reserveId == reserveID) {
                        str = '<div class="costtab"><div class="module" style="float:left; text-align:center; width:10% !important;"><input type="radio" name="radiog_dark" id="year" class="css-checkbox" onClick="paymentSelect(this,\'yearPass\')"/><label for="year" class="css-label radGroup2"></label></div><div class="module" style="float:left; text-align:left;">Yearpass</div><div class="module" style="float:left; text-align:center; ">R<span id="yearPassCost">' + result.yearPassCost+ '</span>&nbsp;p.a</div><div class="module"  style="float:left;padding-right:5px;text-align:right;width:25% !important;" id="yearqty">0</div><div class="module" style="float:right; text-align:right; padding-right:10px;"><img src="images/plus.png" width="25" height="25" onclick=\'addqty("yearqty")\'/><img src="images/minus.png" alt="" width="25" height="25" onclick=\'lessqty("yearqty")\'/></div></div><div class="costtab"><div class="module" style="float:left;  text-align:center; width:10% !important;" ><input type="radio" name="radiog_dark" id="day" class="css-checkbox" onClick="paymentSelect(this,\'dayPass\')"/><label for="day" class="css-label radGroup2"></label></div><div class="module" style="float:left; ">Daypass</div><div class="module" style="float:left;text-align:center; ">R<span id="dayPassCost">' + result.dayPassCost + '</span>&nbsp;p.m</div><div class="module" style="float:left; padding-right:5px; text-align:right; width:25% !important;" id="dayqty">0</div><div class="module" style="float:right; text-align:right;padding-right:10px;"><img src="images/plus.png" alt="" width="25" height="25" onclick=\'addqty("dayqty")\'/><img src="images/minus.png" alt="" width="25" height="25" onclick=\'lessqty("dayqty")\'/></div></div>';
                    }
                // }
                $('#dataTabx').html(str);
                updateTrailsList(result.trails.data);
            }
        });
    }
    else {
        $("#regionerror").html("Please select region");
    }
}

function updateTrailsList(trails) {

    $('#trailinfo').html("");
    str = "<option value=''>Select Trail</option>";
    if(trails.length > 0) {
        for (var key in trails) {
            str += "<option value=" + trails[key]['trailId'] + ">" + trails[key]['trailName'] + "</option>";
        }
    }
    $('#where_Trail2').html(str);
}

function getTrailInfo(trailId) {
    $('#trailinfo').html("");
    var reserveID = $("#where_Trail").val();
    var surl = remote_url + "trails/" + trailId;

    if (reserveID) {
        $.ajax({
            "async": true,
            "crossDomain": true,
            "url": surl,
            "type": "GET",
            headers: {"Authorization": access_token},
            "success": function (result) {
                var str = '';
                var mapUrl = '';
                str += result.trailDescription;
                mapUrl = result.trailMapUrl;
                var mapID = getQueryVariable("mid", mapUrl);
                mapUrl = "https://www.google.com/maps/d/embed?mid=" + mapID;
                //str = $('<iframe src="' + mapUrl + '" width="100%" height="480px"/>');
                str = $('<a href="' + mapUrl + '" target="_blank">Please click here to view the trail map</a>');
                $('#trailinfo').html(str);

            }
        });
    }
    else {
        $("#reserveerror").html("Please select reserve");
    }
}

function lessqty(id) {
    var idx = "#" + id;
    var val = parseInt($(idx).html()) - 1;
    if (val >= 0)  $(idx).html(val);
    getsum();


}

function addqty(id) {
    var idx = "#" + id;
    var val = parseInt($(idx).html()) + 1;
    if (val >= 0)  $(idx).html(val);
    getsum();
}

function getsum() {

    var yearPassCost = parseFloat($("#yearPassCost").html());
    var yearqty = parseInt($("#yearqty").html());
    var dayPassCost = parseInt($("#dayPassCost").html());
    var dayqty = parseFloat($("#dayqty").html());

    var total = (yearPassCost * yearqty) + (dayPassCost * dayqty);


    $("#total_amt").html(total.toFixed(2));
    $("#amount").html(total.toFixed(2));
}

function paymentSelect(elem, flag) {
    if (elem.checked == true && flag == 'yearPass') {
        $(".datetab").css("display", "none");
        $("#dayPassDate").val("");
        $("#dayqty").html("0");
        $("#yearqty").html("1");

    }

    if (elem.checked == true && flag == 'dayPass') {
        $(".datetab").css("display", "table");
        $("#yearqty").html("0");
        $("#dayqty").html("1");
    }
    getsum();
}

////payment section
function validateCart() {

    $("#payment-form").html("");
    $("#dayPassDate_error").html("");
    var day = document.getElementById('day');
    var year = document.getElementById('year');
    var date = document.getElementById("dayPassDate").value;
    var qty = 0;

    if (day.checked == true) qty = parseInt($("#dayqty").html());
    else qty = parseInt($("#yearqty").html());


    if (day.checked == false && year.checked == false) $("#dayPassDate_error").html("Please Select Pass");
    else if (date == "" && day.checked == true) $("#dayPassDate_error").html("Please Select Date");
    else if (qty <= 0) $("#dayPassDate_error").html("Please Add No. of Passes");
    else {
        createPeachCheckoutForm();
    }


}

function resetPeachCheckoutForm() {
    sessionStorage.removeItem("checkoutId");
    $("#modal_payment").hide();
    $(".spinner").remove();
    var shopperResultUrl = document.location.origin + "/payment.html";
    var iframe = '<iframe name="peachIframe" id="peachIframe" class="wpwl-target" frameborder="0" onload="onPeachIframeLoad(this)" />';
    var form = '<form action="' + shopperResultUrl + '" class="paymentWidgets">VISA VISAELECTRON MASTER</form>';
    $("#dropin-container").html(iframe + form);
}

function createPeachCheckoutForm() {
    resetPeachCheckoutForm();
    var pay_amount = parseFloat($("#amount").html());

    $.ajax({
        type: "GET",
        datatype: "json",
        url: remote_url + "payments/token",
        data: { 'amount': pay_amount },
        headers: {"Authorization": access_token},
        beforeSend: function () { openModal(); },
        success: function (result) {
            sessionStorage.setItem("checkoutId", result.checkoutId);
            script = 'https://oppwa.com/v1/paymentWidgets.js?checkoutId=' + result.checkoutId;
            $.ajaxSetup({ cache: true });
            $.getScript( script );
        },
        error: function (jqXHR) {
            if (jqXHR.status == 401) {
                RefreshToken(createPeachCheckoutForm);
            } else {
                var responseObject = jqXHR.responseJSON;
                var message = responseObject.message;
                $("#dayPassDate_error").html(message);
            }
        }
    });
}

function processPeachPayment() {
    var checkoutId = sessionStorage.getItem("checkoutId");
    var pay_amount = parseFloat($("#amount", window.parent.document).html());
    var reserve    = parseInt($("#where_Trail", window.parent.document).val());
    var date       = $("#dayPassDate", window.parent.document).val();
    var day        = $("#day", window.parent.document);

    if (day.prop('checked') == true) {
        var isDayPass = true;
        var qty       = parseFloat($("#dayqty", window.parent.document).html());
    } else {
        var isDayPass = false;
        var qty       = parseFloat($("#yearqty", window.parent.document).html());
    }

    $.ajax({
        type: "POST",
        datatype: "json",
        url: remote_url + "payments",
        data: {
            'checkoutId': checkoutId,
            'amount': pay_amount,  //required
            'reserveId': reserve,  //required
            'isDayPass': isDayPass,//required
            'noOfPasses': qty,  //ignored if a year pass is bought
            'dayPassDate': date    //ignored if a year pass is bought
        },
        headers: {"Authorization": access_token},
        beforeSend: function () {
            openModal();
            $('.payment-status').html('Checking payment status');
        },
        success: function (result) {
            // console.log(result);
            if(result.message === 'success') {
                parent.load_profile_Data();
                $('.payment-status').html('<p>Thank you for your payment of R' + pay_amount + '.</p>');
                closeModal();
            }
        },
        error: function (jqXHR) {
            if (jqXHR.status == 401) {
                RefreshToken(processPeachPayment);
            } else {
                $('.payment-status').html("Something went wrong. Please contact support");
                closeModal();
            }
        },
    });
}

function onPeachIframeLoad(obj) {
    if($(obj).contents().get(0) === undefined) {
        $(obj).height('540px');
    } else {
        $(obj).height('100px');
    }
    // console.log($(obj).contents().get(0));
}

function payment_history() {


    $.ajax({
        type: "GET",
        contentType: "application/json;charset=utf-8",
        accept: "application/json",
        dataType: "json",
        global: false,
        // async: false,
        cache: false,
        url: remote_url + "payments?include=reserve",
        headers: {"Authorization": access_token},
        success: function (result) {
            passes = result.data;
            paymentArray = [];
            for (var key in passes) {
                var innerpaymentArray = {};
                innerpaymentArray['transactionDate'] = passes[key]['transactionDate'];
                innerpaymentArray['passType'] = passes[key]['passType'];
                innerpaymentArray['passAmount'] = passes[key]['passAmount'];
                innerpaymentArray['passDate'] = passes[key]['passDate'];
                innerpaymentArray['reserveName'] = passes[key]['reserve']['reserveName'];
                innerpaymentArray['passId'] = passes[key]['passId'];

                paymentArray.push(innerpaymentArray);
            }
            reder_payment_history();
            reder_payment_made();
        },
        error: function (jqXHR) {
            if (jqXHR.status == 401) {
                if (access_token != '') {
                    RefreshToken(payment_history);
                }
            }
        }
    });

}

function reder_payment_history() {

    var paymentArray_sorted = [];

    paymentArray_sorted = paymentArray.sort(function (a, b) {
        var dateA = new Date(a.transactionDate), dateB = new Date(b.transactionDate)
        return dateB - dateA //sort by date ascending
    });

    var str = "";
    for (var key in paymentArray_sorted) {
        var paydate = paymentArray_sorted[key]['transactionDate'].split("T");
        var passdate = paymentArray_sorted[key]['passDate'].split("T");
        str += '<div class="favright" style="border-bottom: 1px dashed #fff; padding-bottom:4px;margin-bottom:4px; font-size:15 !important;">' + paymentArray_sorted[key]['passType'] + '-' + paymentArray_sorted[key]['reserveName'] + '-R' + paymentArray_sorted[key]['passAmount'] + '<br> Payment Date :' + paydate[0] + '<br> Expiry Date :' + passdate[0] + '<br /></div><div class="favleft"><img src="icons/payments.png"/></div>';
    }
    $("#pay_history").html(str);
    $("#pay_history2").html(str);
}

function reder_payment_made(flag) {

    var paymentArray_filterd = [];

    paymentArray_filterd = paymentArray.filter(function (a) {
        var x = new Date(a.passDate)
        var y = new Date((new Date()).setHours(0, 0, 0, 0));
        return (x.getTime() >= y.getTime());
    });

    if (sessionStorage.getItem("pagekey"))
        var keyval = parseInt(sessionStorage.getItem("pagekey"));
    else
        var keyval = 0;

    if (flag == 'next') {
        keyval = keyval + 5;
        if (keyval >= paymentArray_filterd.length) keyval = 0;
        sessionStorage.setItem("pagekey", keyval);
    }

    if (flag == 'previous') {
        keyval = keyval - 5;
        if (keyval < 0)keyval = paymentArray_filterd.length - (paymentArray_filterd.length % 5);
        sessionStorage.setItem("pagekey", keyval);
    }

    paymentArray_sorted = paymentArray_filterd.sort(function (a, b) {
        var dateA = new Date(a.passDate), dateB = new Date(b.passDate)
        return dateB - dateA
    });

    var str = "";
    var str_list = "";
    for (var key = keyval; key < keyval + 5; key++) {
        if (key < paymentArray_sorted.length) {

            var paydate = paymentArray_sorted[key]['transactionDate'].split("T");
            var passdate = paymentArray_sorted[key]['passDate'].split("T");
            var passYear = passdate[0].split("-");
            var substrs = "";
            var datepass = "NA";
            var rowId = key + 1;

            if (paymentArray_sorted[key]['passType'] == 'LongtermPass') {
                substrs = "(Yearly Membership -" + passYear[0] + ")";
                sustrs2 = "<td>-</td>";
                sustrs2_list = "";
                sustrs1 = "";
            }
            else {
                datepass = passdate[0];
                sustrs2 = '<td onclick="show_rider(\'' + paymentArray_sorted[key]["passId"] + '\',\'' + paymentArray_sorted[key]["reserveName"] + '\',\'' + datepass + '\')" style="cursor:pointer;">Rider</a></td>';

                sustrs2_list_inner = '<div onclick="show_rider(\'' + paymentArray_sorted[key]["passId"] + '\',\'' + paymentArray_sorted[key]["reserveName"] + '\',\'' + datepass + '\')" style="cursor:pointer;float:right;">Rider</a></div>';

                sustrs2_list = '<li class="payLiID" style=" padding:0 !important;"">' + sustrs2_list_inner + '</li>';

                sustrs1 = paymentArray_sorted[key]["passId"];
            }

            str += '<tr><td>' + rowId + '</td><td>' + paymentArray_sorted[key]["reserveName"] + '&nbsp;' + substrs + '</td><td>' + datepass + '</td><td>R' + paymentArray_filterd[key]["passAmount"] + '</td>' + sustrs2 + '</tr>';

            str_list += '<ul class="payTab" id="list_view"><li class="payLiID" style="padding:0 !important;">ID :' + sustrs1 + ' ' + paymentArray_sorted[key]["reserveName"] + '&nbsp;' + substrs + ' </li><li class="payLiID" style="padding:0 !important;">Pass Date : ' + datepass + '</li><li class="payLiID" style="padding:0 !important;">Cost : R' + paymentArray_filterd[key]["passAmount"] + '</li>' + sustrs2_list + '</ul>';
        }
    }

    str_list += '<ul class="payTab"><li class="payLiID"  style="padding:0 !important;"><div style="float:left;"><a href="#payment_hostory_repeat" style="padding-top:5px;">Historic Payments</a></div><div style="float:right;"> <a href="#"><img src="images/previous.png" width="25" height="25" border="0" onClick="reder_payment_made(\'previous\')" /></a><a href="#"><img src="images/next.png" alt="" width="25" height="25" border="0" onClick="reder_payment_made(\'next\')"/></a></li></ul></div>';

    $("#payment_made_rows").html(str);
    $("#payMain").html(str_list);

}

function get_missing_photo(flag) {
    var str = "";
    var missing_photoArrayx = [];

    $.ajax({
        type: "GET",
        contentType: "application/json;charset=utf-8",
        accept: "application/json",
        dataType: "json",
        url: remote_url + "daypasses?photo=null&include=reserve",
        headers: {"Authorization": access_token},
        success: function (result) {
            for (var key in result.data) {
                var innerpaymentArray = {};
                innerpaymentArray['passId'] = result.data[key]['passId'];
                innerpaymentArray['passAmount'] = result.data[key]['passAmount'];
                innerpaymentArray['passDate'] = result.data[key]['passDate'];
                innerpaymentArray['reserveName'] = result.data[key]['reserve']['reserveName'];
                missing_photoArrayx.push(innerpaymentArray);
            }


            var missing_photoArray_filterd = [];

            missing_photoArray_filterd = missing_photoArrayx.filter(function (a) {
                var x = new Date(a.passDate)
                var y = new Date((new Date()).setHours(0, 0, 0, 0));
                return (x.getTime() >= y.getTime());
            });

            missing_photoArray = missing_photoArray_filterd.sort(function (a, b) {
                var dateA = new Date(a.passDate), dateB = new Date(b.passDate)
                return dateB - dateA //sort by date ascending
            });


            if (missing_photoArray.length > 0) {
                $(".txt").css('display', 'block');
                $(".txt").html(missing_photoArray.length);
                $("#pcnt").html(missing_photoArray.length);
                if (flag == 'missing') location.href = "#missphotosprompt";
            }

            var str = "";
            for (var key in missing_photoArray) {
                var passdate = missing_photoArray[key]['passDate'].split("T");
                var passId = missing_photoArray[key]['passId'];
                var strreserv = missing_photoArray[key]['reserveName'];
                var passdstr = passdate[0];

                str += '<div onclick="setPassId(' + passId + ',\'' + strreserv + '\',\'' + passdstr + '\');" class="passselect"><div class="favright" style="border-bottom: 1px dashed #fff; padding-bottom:4px;margin-bottom:4px; font-size:15 !important;">' + 'PassId :' + missing_photoArray[key]['passId'] + ' * ' + missing_photoArray[key]['reserveName'] + '<br>Pass Amount:' + missing_photoArray[key]['passAmount'] + '<br> Pass Date :' + passdate[0] + '<br/></div>' + '<div class="favleft">' + '<img src="images/camera.png" /></div></div>';

            }
            $("#missing_photo").html(str);
        },
        error: function (jqXHR) {
            if (jqXHR.status == 401) {
                if (access_token != '') {
                    RefreshToken(payment_history);
                }
            }
        }
    });
}

function setPassId(passId, reserve, date) {
    $("#passId_hidden").val(passId);
    $("#passId_reserv").html(reserve);
    $("#passId_date").html(date);
    location.href = "#modal_pass_photo";
}

// load pass photos...
function load_pass_photo(flag) {
    var frmname = "#pass_form_" + flag;
    var fieldname = "#pass_photo_" + flag;

    if ($(frmname).valid()) {
        var form = new FormData();

        var files = $(fieldname).get(0).files;
        form.append("filename", files[0]);

        var passId = $("#passId_hidden").val();

        $.ajax({
            "async": true,
            "crossDomain": true,
            "url": remote_url + "daypasses/" + passId + "/photo",
            "method": "POST",
            "headers": {
                "Authorization": access_token,
                "cache-control": "no-cache"
            },
            "processData": false,
            "contentType": false,
            "mimeType": "multipart/form-data",
            "data": form,
            "beforeSend": function () {
                openModal();
            },
            complete: function () {
                closeModal();
            },
            "success": function (result, status, jqXHR) {
                if (jqXHR.status == 200 && flag == 'missing') {
                    reload_photo_array(passId);
                    get_missing_photo(flag);
                    // console.log($("#missing_photo").html());
                    if($("#missing_photo").html().length > 0) {
                        location.href = "#pass_photo_section";
                    }
                }
                else if (jqXHR.status == 200 && flag == 'rider') {
                    reload_photo_array(passId);
                    get_missing_photo(flag);
                }
            },
            "error": function (jqXHR, status) {

                if (jqXHR.status == 200 && flag == 'missing') {
                    location.href = "#pass_photo_section";
                }
                else if (jqXHR.status == 200 && flag == 'rider') {
                    location.href = "#modal_PaymentRiders";
                }


                else if (jqXHR.status == 401) {
                    if (access_token != '') {
                        RefreshToken(load_photo);
                    }
                }
            }
        });
    }
}

function padLeft(str) {
    var pad = "0000000";
    var ans = pad.substring(0, pad.length - str.length) + str;
    return ans;
}

function show_rider(passId, reserve, passDate) {

    $("#rider_photo").attr("src", "images/profile_pic99.jpg");
    $("#resname").html(reserve);
    $("#dpassid").html(padLeft(passId));
    $("#respdate").html(passDate);
    $(".passId_hidden").val(passId);

    if (ridersPhotoArray[passId]) {
        // var ntime= Math.random();
        $("#rider_photo").attr("src", ridersPhotoArray[passId]);
    }

    location.href = "#modal_PaymentRiders";
}

function reload_photo_array(dpId) {
    ridersPhotoArray = {};
    $.ajax({
        type: "GET",
        contentType: "application/json;charset=utf-8",
        accept: "application/json",
        dataType: "json",
        url: remote_url + "user?include=daypasses",
        headers: {"Authorization": access_token},
        success: function (result) {
            dayPasses = result['daypasses']['data'];
            for (var key in dayPasses) {
                ridersPhotoArray[dayPasses[key]['passId']] = dayPasses[key]['photos']['medium'];
            }
            $("#rider_photo").attr("src", ridersPhotoArray[dpId] + "?timestamp=" + new Date().getTime());
        },
        error: function (jqXHR) {

        }
    });
}
