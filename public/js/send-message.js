const ms_baseUrl = '/schedule/';

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
                url: ms_baseUrl + 'create',
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

    loadSchedule();
});

const loadSchedule = function () {
    showLoading();
    $.get(ms_baseUrl + 'list', function (res) {
        $('#schedule-table').html('');
        $.each(res.data, function (index, item) {
            $('#schedule-table').append(`
            <tr>
                <td>${index + 1}</td>
                <td>${item.message}</td>
                <td>
                    <div>
                        <span>${item.status ? 'Chờ gửi' : 'Đã gửi'} </span>
                    </div>
                </td>
                <td>
                    <div>
                        <button class="row-btn delete" onclick="viewConfirmDeleteSchedule('${
                            item._id
                        }')">Xóa</button>
                    </div>
                </td>
            </tr>
            `);
        });
        closeLoading();
    });
};

const viewConfirmDeleteSchedule = function (id) {
    showModal('#confirm-delete-schedule');

    $('#confirm-delete-schedule .submit')
        .unbind('click')
        .on('click', function () {
            $.ajax({
                url: ms_baseUrl + `delete/${id}`,
                type: 'DELETE',
                success: function (res) {
                    if (res.statusCode === 200) {
                        closeModal('#confirm-delete-schedule');
                        loadSchedule();
                    } else {
                        alert(res.message ?? 'Lỗi hệ thống.');
                    }
                    closeLoading();
                },
            }).fail(function () {
                alert('Lỗi hệ thống.');
                closeLoading();
            });
        });
};
