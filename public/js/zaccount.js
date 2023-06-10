const acc_baseUrl = '/zaccount/';

$(function () {
    loadTableData();

    $('#add-account .submit')
        .unbind('click')
        .on('click', function () {
            const id = $('#add-account #hidden-za').val();
            if (id) {
                updateZAccount(id);
            } else {
                createNewZAccount();
            }
        });

    $('#add-item').on('click', function () {
        cleanModal();
    });
});

const showModal = function (modal = '#add-account') {
    $(modal).show();
};

const closeModal = function (modal = '#add-account') {
    $(modal).hide();
};

const cleanModal = function (modal = '#add-account') {
    $(modal + ' input').val('');
    $(modal + ' textarea').val('');
};

const loadTableData = function () {
    showLoading();
    $.get(acc_baseUrl + 'list', function (res) {
        $('#zaccount-table').html('');
        $.each(res.data, function (index, item) {
            $('#zaccount-table').append(`
            <tr>
                <td>${index + 1}</td>
                <td>${item.phone}</td>
                <td>
                    <div>
                        <span>${item.inUse ? 'Đang' : 'Chưa'} kích hoạt</span>
                        <button class="row-btn pick-up ${
                            item.inUse ? 'hide' : ''
                        }" onclick="pickAccount('${item._id}')">Kích hoạt</button>
                    </div>
                </td>
                <td>
                    <div>
                        <button class="row-btn edit" onclick="viewAccount('${
                            item._id
                        }')">Sửa</button>
                        <button class="row-btn delete" onclick="viewConfirmDelete('${
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

const createNewZAccount = function () {
    showLoading();
    const phone = $('#add-account .phone').val();
    const psw = $('#add-account .password').val();
    const cfPw = $('#add-account .cf-password').val();
    const cookies = $('#add-account .cookies').val();

    if (psw !== cfPw) {
        alert('Mật khẩu xác nhận không khớp.');
        closeLoading();
        return;
    }

    $.post(
        acc_baseUrl + 'create',
        {
            phone,
            password: psw,
            cookies,
        },
        function (res) {
            if (res.statusCode === 200) {
                closeModal();
                loadTableData();
                //alert('Tạo tài khoản thành công.');
            } else {
                alert(res.message ?? 'Lỗi hệ thống.');
            }
            closeLoading();
        },
    ).fail(function () {
        alert('Lỗi hệ thống.');
        closeLoading();
    });
};

const updateZAccount = function (id) {
    showLoading();
    const phone = $('#add-account .phone').val();
    const psw = $('#add-account .password').val();
    const cfPw = $('#add-account .cf-password').val();
    const cookies = $('#add-account .cookies').val();

    if (psw !== cfPw) {
        alert('Mật khẩu xác nhận không khớp.');
        closeLoading();
        return;
    }

    $.ajax({
        url: acc_baseUrl + `update/${id}`,
        type: 'PUT',
        data: {
            phone,
            password: psw,
            cookies,
        },
        success: function (res) {
            if (res.statusCode === 200) {
                closeModal();
                loadTableData();
                //alert('Tạo tài khoản thành công.');
            } else {
                alert(res.message ?? 'Lỗi hệ thống.');
            }
            closeLoading();
        },
    }).fail(function () {
        alert('Lỗi hệ thống.');
        closeLoading();
    });
};

const viewAccount = function (id) {
    showLoading();
    cleanModal();
    $.get(acc_baseUrl + id, function (res) {
        if (res.statusCode == 200) {
            $('#add-account .phone').val(res.data.phone);
            $('#add-account #hidden-za').val(res.data._id);
            showModal();
        }
        closeLoading();
    });
};

const viewConfirmDelete = function (id) {
    showModal('#confirm-delete');

    $('#confirm-delete .submit')
        .unbind('click')
        .on('click', function () {
            $.ajax({
                url: acc_baseUrl + `delete/${id}`,
                type: 'DELETE',
                success: function (res) {
                    if (res.statusCode === 200) {
                        closeModal('#confirm-delete');
                        loadTableData();
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

const pickAccount = function (id) {
    $.ajax({
        url: acc_baseUrl + `pick/${id}`,
        type: 'PATCH',
        success: function (res) {
            if (res.statusCode === 200) {
                loadTableData();
            } else {
                alert(res.message ?? 'Lỗi hệ thống.');
            }
            closeLoading();
        },
    }).fail(function () {
        alert('Lỗi hệ thống.');
        closeLoading();
    });
};
