function showLoading() {
    $('#loading-view').show();
}

function closeLoading() {
    $('#loading-view').hide();
}

$(document).ready(async function () {
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

function formatDate(d) {
    const datestring =
        ('0' + d.getDate()).slice(-2) +
        '/' +
        ('0' + (d.getMonth() + 1)).slice(-2) +
        '/' +
        d.getFullYear() +
        ' ' +
        ('0' + d.getHours()).slice(-2) +
        ':' +
        ('0' + d.getMinutes()).slice(-2);
    return datestring;
}
