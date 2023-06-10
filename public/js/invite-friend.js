$(function () {
    $('#Friends .text-option').on('change', function () {
        $('#Friends .form-item.text').show();
        $('#Friends .form-item.file').hide();
        $('#invite-form .phone-file').val('');
    });

    $('#Friends .file-option').on('change', function () {
        $('#Friends .form-item.text').hide();
        $('#Friends .form-item.file').show();
        $('#invite-form .phone-number').val('');
    });

    $('#add-frd')
        .unbind('click')
        .on('click', function () {
            showLoading();
            const formData = new FormData();
            formData.append('phone', $('#invite-form .phone-number').val());
            formData.append('file', $('#invite-form .phone-file')[0].files[0]);

            $.ajax({
                type: 'post',
                url: '/friend/invite',
                data: formData,
                processData: false,
                contentType: false,
                success: function (data) {
                    if (data.statusCode == 200) {
                        $('form#invite-form input').val('');
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
