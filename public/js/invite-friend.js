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

    $('#view-invitation')
        .unbind('click')
        .on('click', function () {
            $('#invitation-history').show();
            loadInvitationHistory();
        });

    $('#invitation-history .search-wrapper .btn-search')
        .unbind('click')
        .on('click', function () {
            console.log('searching...');
            const phone = $(
                '#invitation-history .search-wrapper .search-phone',
            ).val();
            const status = $(
                '#invitation-history .search-wrapper .search-result',
            ).val();
            loadInvitationHistory(phone, status);
        });

    $('#invitation-page-size').on('change', function () {
        $('#invitation-history .search-wrapper .btn-search').trigger('click');
    });
});

// const loadInvitationHistory2 = function () {
//     showLoading();
//     $.post(
//         '/history/list',
//         {
//             action: 'invitation',
//             search: '',
//             from: null,
//             to: null,
//             account: null,
//         },
//         function (res) {
//             $('#invitation-hs-table').html('');
//             $.each(res.data, function (index, item) {
//                 $('#invitation-hs-table').append(`
//             <tr>
//                 <td>${index + 1}</td>
//                 <td>${item.phone}</td>
//                 <td>${item.account.phone}</td>
//                 <td class="${
//                     item.result
//                 }-text">${item.result.toUpperCase()}</td>
//                 <td>${item.note ?? ''}</td>
//                 <td>${formatDate(new Date(item.createdAt))}</td>
//             </tr>
//             `);
//             });
//             closeLoading();
//         },
//     );
// };

const loadInvitationHistory = function (search = '', status = null) {
    showLoading();
    $('#invitation-pagination-container').pagination({
        ajax: function (options, refresh, $target) {
            showLoading();
            $.post(
                `/history/list?page=${options.current}&size=${$(
                    '#invitation-page-size',
                ).val()}`,
                {
                    action: 'invitation',
                    search,
                    status,
                    from: null,
                    to: null,
                    account: null,
                },
                function (res) {
                    $('#invitation-hs-table').html('');
                    if (res.statusCode == 200) {
                        $.each(res.data, function (index, item) {
                            $('#invitation-hs-table').append(`
                                <tr>
                                    <td>${index + 1}</td>
                                    <td>${item.phone}</td>
                                    <td>${item.account.phone}</td>
                                    <td class="${
                                        item.result
                                    }-text">${item.result.toUpperCase()}</td>
                                    <td>${item.note ?? ''}</td>
                                    <td>${formatDate(
                                        new Date(item.createdAt),
                                    )}</td>
                                </tr>
                            `);
                        });

                        refresh({
                            total: res.total, // optional
                            length: $('#invitation-page-size').val(), // optional
                        });
                    } else {
                        refresh({
                            total: 0, // optional
                            length: $('#invitation-page-size').val(), // optional
                        });
                    }
                    closeLoading();
                },
            ).fail(function (error) {
                closeLoading();
            });
        },
    });
};
