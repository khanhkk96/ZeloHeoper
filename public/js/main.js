function showLoading() {
    $('#loading-view').show();
}

function closeLoading() {
    $('#loading-view').hide();
}

$(document).ready(async function () {
    $('#send-message')
        .unbind('click')
        .on('click', function () {
            showLoading();
            //const formData = new FormData();

            //- if($('#shareholder-list')[0].files[0] && !$('#shareholder-list')[0].files[0]?.name.endsWith('.xlsx')){
            //-     alert('Mẫu thư phải là file .xlsx')
            //-     closeLoading();
            //-     return;
            //- }

            //- formData.append("shareholder-list", $('#shareholder-list')[0].files[0]);
            //- formData.append("phone", $('#phone-number').val());
            //- formData.append("message", $('#message').val());

            $.post(
                '/send',
                {
                    phone: $('#phone-number').val(),
                    message: $('#message').val(),
                },
                function (data) {
                    closeLoading();
                    if (data.code == 200) {
                        //$('form input').val('');
                        $('form textarea').val('');
                        alert(data.message);
                    } else {
                        alert(data.message);
                    }
                },
            );

            //- $.ajax({
            //-     type:'post',
            //-     url: '/send',
            //-     data: formData,
            //-     processData: false,
            //-     contentType: false,
            //-     success: function(data){
            //-         closeLoading();
            //-         if(data.code == 200){
            //-             $('form input').val('');
            //-             $('form textarea').val('');
            //-         }
            //-         else{
            //-             alert(data.message)
            //-         }
            //-     },
            //-     error: function(err){
            //-         if(err.status == 500){
            //-             alert(err.statusText)
            //-         }
            //-         else{
            //-             console.log(err.error);
            //-         }
            //-         closeLoading();
            //-     }
            //- })
        });

    $('#add-frd')
        .unbind('click')
        .on('click', function () {
            showLoading();
            //- const formData = new FormData();
            //- formData.append("phone", $('#phone-number').val());

            $.post(
                '/add-friend',
                { phone: $('#phone-number').val() },
                function (data) {
                    closeLoading();
                    if (data.code == 200) {
                        $('form input').val('');
                        alert(data.message);
                    } else {
                        alert(data.message);
                    }
                },
            );
            //- $.ajax({
            //-     type:'post',
            //-     url: '/add-friend',
            //-     data: formData,
            //-     processData: false,
            //-     contentType: false,
            //-     success: function(data){
            //-         console.log(data)
            //-         closeLoading();
            //-         if(data.code == 200){
            //-             $('form input').val('');
            //-         }
            //-         else{
            //-             alert(data.message)
            //-         }
            //-     },
            //-     error: function(err){
            //-         if(err.status == 500){
            //-             alert(err.statusText)
            //-         }
            //-         else{
            //-             console.log(err.error);
            //-         }
            //-         closeLoading();
            //-     }
            //- })
        });

    $('#login')
        .unbind('click')
        .on('click', function () {
            showLoading();
            $.get('/login', function (data) {
                closeLoading();
                alert(data.message);
                // if (data.code == 200) {
                //     alert(data.message);
                // } else {
                //     alert(data.message);
                // }
            });
        });

    $('#add-cookies')
        .unbind('click')
        .on('click', function () {
            showLoading();

            $.post(
                '/add-cookies',
                { cookies: $('#cookies').val() },
                function (data) {
                    closeLoading();
                    if (data.code == 200) {
                        $('#cookies').val('');
                        alert(data.message);
                    } else {
                        alert(data.message);
                    }
                },
            );
        });

    $('.modal .cancel')
        .unbind('click')
        .on('click', function () {
            $(this).parents('div.modal').hide();
        });

    $('.modal .close')
        .unbind('click')
        .on('click', function () {
            $(this).parents('div.modal').hide();
        });
});

function openCity(evt, cityName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName('tabcontent');
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = 'none';
    }
    tablinks = document.getElementsByClassName('tablinks');
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(' active', '');
    }
    document.getElementById(cityName).style.display = 'block';
    evt.currentTarget.className += ' active';
}
