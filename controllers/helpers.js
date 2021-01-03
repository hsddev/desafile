const User = require('../models/user');
const File = require('../models/file');
const Notification = require('../models/notification');

// ## Controller Helpers
// Is User Logged ?
exports.isLogged = (req, res, next) => {
  if (!req.session.userId) return res.status(403).redirect('/login');
  return User.findOne({
    where: { id: req.session.userId }
  }).then((user) => {
    if (!user) {
      req.session.userId = false;
      return res.status(403).redirect('/login');
    }
    req.user = user;
    return next();
  });
};

// Get User Categories
exports.getCategories = (req, res, next) => {
  File.findAll({ where: { userId: req.user.get('id') } }).then((values) => {
    req.userCategories = values.length > 0
      ? Array.from(new Set(values.map(value => value.get('category')).filter(item => !!item)))
      : [];
    return next();
  });
};

// Get All Users
exports.getUsers = (req, res, next) => {
  User.findAll().then((values) => {
    req.users = values.map(value => ({
      id: value.get('id'),
      username: value.get('username'),
      fullname: value.get('fullname'),
      avatar: value.get('avatar')
    }));
    return next();
  });
};

// Get User Notifications
exports.getNotifications = (req, res, next) => {
  Notification.findAll({ where: { userId: req.user.get('id') } }).then((values) => {
    req.notifications = values.length > 0
      ? values.map(value => ({
        id: value.get('id'),
        title: value.get('title'),
        description: value.get('description'),
        type: value.get('type'),
        link: value.get('link'),
        seen: !!value.get('seen'),
        createdAt: value.previous('seen') ? value.get('updatedAt') : value.get('createdAt')
      }))
      : [];
    return next();
  });
};

exports.sendAllNotification = (io, userId, newNotiId) => {
  console.log(io);
  Notification.findAll({ where: { userId } }).then((dbNotifications) => {
    if (dbNotifications.length > 0) {
      const notifications = dbNotifications.map(notification => ({
        id: notification.get('id'),
        title: notification.get('title'),
        description: notification.get('description'),
        type: notification.get('type'),
        link: notification.get('link'),
        seen: !!notification.get('seen'),
        createdAt: notification.previous('seen')
          ? notification.get('updatedAt')
          : notification.get('createdAt')
      }));
      io.in(userId).emit('new notification', {
        notifications,
        new: notifications.find(noti => noti.id === newNotiId)
      });
    }
  });
};
