$(function () {
    $('#MessageBox .text-option').on('change', function () {
        $('#MessageBox .form-item.text').show();
        $('#MessageBox .form-item.file').hide();
        $('#send-form .phone-file').val('');
    });

    $('#MessageBox .file-option').on('change', function () {
        $('#MessageBox .form-item.text').hide();
        $('#MessageBox .form-item.file').show();
        $('#send-form .phone-number').val('');
    });

    $('#send-ms')
        .unbind('click')
        .on('click', function () {
            showLoading();
            const formData = new FormData();
            formData.append('phone', $('#send-form .phone-number').val());
            formData.append('file', $('#send-form .phone-file')[0].files[0]);
            formData.append('sendTime', $('#send-form .send-time').val());
            formData.append('message', $('#send-form .message').val());

            $.ajax({
                type: 'post',
                url: '/schedule/create',
                data: formData,
                processData: false,
                contentType: false,
                success: function (data) {
                    if (data.statusCode == 200) {
                        $('form#send-form input').val('');
                        $('form#send-form textarea').val('');
                        alert(data.message);
                    } else {
                        alert(data.message);
                    }
                    closeLoading();
                },
                error: function (err) {
                    alert('Lỗi hệ thống.');
                    closeLoading();
                },
            });
        });
});
