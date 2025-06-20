const path = require('path');
const AppRequestReturn = require('../common/app-request-return');
const Schedule = require('../models/schedule.collection');
const fs = require('fs');
const { default: mongoose } = require('mongoose');

module.exports = {
    createSchedule: async (
        file,
        { phone, message, sendTime },
        user,
        account,
    ) => {
        if ((!file && !phone) || !message) {
            return new AppRequestReturn(422, 'Vui lòng nhập thông tin.');
        }

        if (!account) {
            return new AppRequestReturn(
                422,
                'Chưa chọn tài khoản thực hiện hành động.',
            );
        }

        //let phoneList = [];
        let phones = 0;
        if (phone) {
            //phoneList.push(phone);
            phones = 1;
        }

        if (file) {
            const data = fs.readFileSync(file.path, { encoding: 'utf8' });
            //phoneList = data.split('\r\n');
            phones = data.split('\r\n').length;
        }

        if (!phones) {
            return new AppRequestReturn(422, 'Nhập danh sách số điện thoại.');
        }

        let sentTimeAt = undefined;
        if (sendTime) {
            const sendTimevalue = new Date(sendTime);
            if (!(sendTimevalue instanceof Date)) {
                return new AppRequestReturn(
                    422,
                    'Thời gian cài đặt không hợp lệ.',
                );
            }
            sentTimeAt = sendTimevalue;
        }

        await Schedule.create({
            user: user.userId,
            account: account._id,
            time: sentTimeAt ?? new Date(),
            message,
            file: file?.path,
            phoneNumber: phone,
        });

        return new AppRequestReturn(
            200,
            'Cài đặt lịch gửi tin nhắn thành công.',
        );
    },

    editSchedule: async (id, file, { phone, message, sendTime }, account) => {
        if ((!file && !phone) || !message) {
            return new AppRequestReturn(422, 'Vui lòng nhập thông tin.');
        }

        if (!account) {
            return new AppRequestReturn(
                422,
                'Chưa chọn tài khoản thực hiện hành động.',
            );
        }

        // let phoneList = [];
        let phones = 0;
        if (phone) {
            //phoneList.push(phone);
            phones = 1;
        }

        if (file) {
            const data = fs.readFileSync(file.path, { encoding: 'utf8' });
            //phoneList = data.split('\r\n');
            phones = data.split('\r\n').length;
        }

        if (!phones) {
            return new AppRequestReturn(422, 'Nhập danh sách số điện thoại.');
        }

        let sentTimeAt = undefined;
        if (sendTime) {
            const sendTimevalue = new Date(sendTime);
            if (!(sendTimevalue instanceof Date)) {
                return new AppRequestReturn(
                    422,
                    'Thời gian cài đặt không hợp lệ.',
                );
            }
            sentTimeAt = sendTimevalue;
        }

        const schedule = await Schedule.findById(id);
        if (!schedule) {
            return new AppRequestReturn(404, 'Không tìm thấy lịch cài đặt.');
        }

        schedule.message = message;
        schedule.time = sentTimeAt ?? new Date();
        schedule.phoneNumber = phone;
        schedule.account = account._id;
        let oldFile = '';
        if (file) {
            schedule.file = file.path;
            oldFile = schedule.file;
        }

        await schedule.save();

        if (oldFile) {
            const filePath = path.resolve(path.dirname, '..', oldFile);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        return new AppRequestReturn(
            200,
            'Chỉnh sửa kế hoạch gửi tin nhắn thành công.',
        );
    },

    delete: async ({ id }) => {
        if (!id) {
            return new AppRequestReturn(422, 'Vui lòng nhập đầy đủ thông tin.');
        }

        try {
            const schedule = await Schedule.findById(id);
            if (!schedule) {
                return new AppRequestReturn(
                    404,
                    'Không tìm thấy thông tin lịch.',
                );
            }

            if (schedule.isProcessing) {
                return new AppRequestReturn(
                    400,
                    'Lịch cài đặt đang được thực hiện.',
                );
            }

            await Schedule.softDelete(mongoose.Types.ObjectId(id));

            if (schedule.file) {
                const filePath = path.resolve(
                    path.dirname,
                    '..',
                    schedule.file,
                );
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
        } catch (ex) {
            console.log(ex);
            return new AppRequestReturn(
                400,
                'Xóa lịch cài đặt không thành công.',
            );
        }

        return new AppRequestReturn(200, 'Xóa lịch cài đặt thành công.');
    },

    list: async ({ page, size }, { userId }) => {
        const condition = { user: userId };
        // if (key) {
        //     condition['phone'] = { $regex: new RegExp(key, 'i') };
        // }

        const schedules = await Schedule.find(condition)
            .sort({ createdAt: -1 })
            .skip((page - 1) * size)
            .limit(size);

        return new AppRequestReturn(
            200,
            'Lấy danh sách tài khoản thành công.',
            schedules,
        );
    },
};
