// Dependencies
const { validationResult } = require('express-validator/check');
const path = require('path');
const { formatBytes } = require('../helpers');

// Models
const File = require('../models/file');
const Notification = require('../models/notification');

// Config
const details = require('../config/details');

// Helpers
const routesHelpers = require('../helpers/index');
const { sendAllNotification } = require('./helpers');
// ## Controllers
// Get Files
exports.filesGet = (req, res) => {
  File.findAll({ where: { userId: req.user.get('id'), deleted: null } }).then((values) => {
    const files = values.map((value) => {
      const { dataValues: data } = value;
      const sharedWith = req.users.filter(user => value.get('sharedWith').includes(user.id));
      const downloads = value.get('downloads').map((downloadUser) => {
        const user = req.users.find(userObj => userObj.id === downloadUser.id);
        return { ...user, ...downloadUser };
      });
      delete data.deleted;
      delete data.path;
      return {
        ...data,
        downloads,
        sharedWith,
        category: value.get('category'),
        size: formatBytes(data.size)
      };
    });
    const types = new Set(files.map(file => file.type));
    const categories = new Set(files.map(file => file.category).filter(item => !!item));
    return res.status(200).render('pages/files/index', {
      navs: routesHelpers.navsItems('uploaded-files'),
      page: {
        ...details,
        portletTitle: 'Uploaded Files',
        portletDesc: 'Here you can found, download, see and delete your uploaded files.'
      },
      user: {
        username: req.user.get('username'),
        fullname: req.user.get('fullname')
      },
      notifications: req.notifications || [],
      errors: req.flash('errors'),
      title: req.flash('title'),
      description: req.flash('description'),
      panel: req.flash('panel'),
      files: JSON.stringify(files),
      csrfToken: req.csrfToken(),
      types,
      categories
    });
  });
};

// Recived Files Get
exports.recivedFileGet = (req, res) => {
  File.findAll({ where: { deleted: null } }).then((files) => {
    const recivedFiles = files
      .filter(file => file.get('sharedWith').includes(req.user.get('id')))
      .map((value) => {
        const { dataValues: data } = value;
        delete data.deleted;
        delete data.path;
        delete data.sharedWith;
        delete data.category;
        const owner = req.users.find(user => user.id === value.get('userId'));
        return {
          ...data,
          owner: owner.username,
          size: formatBytes(data.size)
        };
      });
    const types = new Set(recivedFiles.map(file => file.type));

    return res.status(200).render('pages/files/index', {
      navs: routesHelpers.navsItems('recived-files'),
      page: {
        ...details,
        type: 'recivedFiles',
        portletTitle: 'Recived Files',
        portletDesc:
          'Here you can found, download, see and delete your recived files from others users.'
      },
      user: {
        username: req.user.get('username'),
        fullname: req.user.get('fullname')
      },
      errors: req.flash('errors'),
      notifications: req.notifications || [],
      title: req.flash('title'),
      description: req.flash('description'),
      panel: req.flash('panel'),
      files: JSON.stringify(recivedFiles),
      csrfToken: req.csrfToken(),
      types,
      categories: []
    });
  });
};

// Deleted Files Get
exports.deletedFilesGet = (req, res) => {
  File.findAll({ where: { userId: req.user.get('id') } }).then((files) => {
    const deletedFiles = files
      .filter(file => file.get('deleted') !== null)
      .map((value) => {
        const { dataValues: data } = value;
        const sharedWith = req.users.filter(user => value.get('sharedWith').includes(user.id));
        const downloads = value.get('downloads').map((downloadUser) => {
          const user = req.users.find(userObj => userObj.id === downloadUser.id);
          return { ...user, ...downloadUser };
        });
        delete data.path;
        const deletedDate = new Date(+data.deleted);
        const deleteAt = deletedDate.setDate(deletedDate.getDate() + 2);
        return {
          ...data,
          sharedWith,
          updatedAt: new Date(deleteAt),
          downloads,
          category: value.get('category'),
          size: formatBytes(data.size)
        };
      });

    const types = new Set(deletedFiles.map(file => file.type));
    return res.status(200).render('pages/files/index', {
      navs: routesHelpers.navsItems('deleted-files'),
      page: {
        ...details,
        type: 'deletedFiles',
        portletTitle: 'Deleted Files',
        portletDesc: 'Here you can found, see and recover your deleted files.'
      },
      user: {
        username: req.user.get('username'),
        fullname: req.user.get('fullname')
      },

      errors: req.flash('errors'),
      notifications: req.notifications || [],
      title: req.flash('title'),
      description: req.flash('description'),
      panel: req.flash('panel'),
      files: JSON.stringify(deletedFiles),
      csrfToken: req.csrfToken(),
      types,
      categories: []
    });
  });
};

// New File Page
exports.filesNewGet = (req, res) => res.status(200).render('pages/files/new', {
  navs: routesHelpers.navsItems('new-file'),
  errors: req.flash('errors'),
  user: {
    username: req.user.get('username'),
    fullname: req.user.get('fullname')
  },

  notifications: req.notifications || [],
  csrfToken: req.csrfToken(),
  title: req.flash('title'),
  description: req.flash('description'),
  categories: JSON.stringify(req.userCategories),
  page: {
    ...details
  }
});

// New File Post
exports.filesNewPost = (req, res) => {
  const errors = validationResult(req);
  const { title, description, category } = req.body;
  if (!errors.isEmpty()) {
    req.flash('title', title);
    req.flash('description', description);
    req.flash('errors', errors.array());
    return res.redirect('/files/new');
  }

  return File.create({
    userId: req.user.get('id'),
    title,
    description,
    originalname: path.parse(req.file.originalname).name,
    ext: path.parse(req.file.originalname).ext,
    type: req.file.mimetype,
    category,
    sharedWith: [],
    downloads: null,
    path: req.file.path,
    size: req.file.size
  }).then(() => {
    req.flash('panel', {
      type: 'success',
      msg: 'File has been successfly created.'
    });
    return res.redirect('/files');
  });
};

// File Page By ID
exports.fileGet = (req, res) => {
  File.findOne({
    where: { id: req.params.fileId }
  }).then((value) => {
    if (!value) {
      req.flash('panel', {
        type: 'danger',
        msg: 'The requested file was not found or you do not have permission to access it.'
      });
      return res.redirect('/files');
    }

    const canEdit = value.get('userId') === req.user.get('id');
    const canSee = value.get('sharedWith').includes(req.user.get('id')) || canEdit;
    if (!canSee) {
      req.flash('panel', {
        type: 'danger',
        msg: 'The requested file was not found or you do not have permission to access it.'
      });
      return res.redirect('/files');
    }
    const users = req.users
      .filter(user => user.id !== req.user.get('id'))
      .map(user => ({
        ...user,
        selected: value.get('sharedWith').includes(user.id)
      }));
    const owner = value.get('userId') === req.user.get('id')
      ? req.user.get('username')
      : users.find(user => user.id === value.get('userId')).username;

    const downloads = value.get('downloads').map((downloadUser) => {
      const user = req.users.find(userObj => userObj.id === downloadUser.id);
      return { ...user, ...downloadUser };
    });

    return Notification.findOne({
      where: { fileId: value.get('id'), userId: req.user.get('id'), seen: 0 }
    })
      .then((noti) => {
        if (!noti) return;
        noti.set('seen', true);
        noti.save();
      })
      .then(() => Notification.findAll({ where: { userId: req.user.get('id') } }))
      .then((values) => {
        const notifications = values.length > 0
          ? values.map(notificationDB => ({
            id: notificationDB.get('id'),
            title: notificationDB.get('title'),
            description: notificationDB.get('description'),
            type: notificationDB.get('type'),
            link: notificationDB.get('link'),
            seen: !!notificationDB.get('seen'),
            createdAt: notificationDB.previous('seen')
              ? notificationDB.get('updatedAt')
              : notificationDB.get('createdAt')
          }))
          : [];
        return res.status(200).render('pages/files/info', {
          navs: routesHelpers.navsItems('file-info'),
          file: {
            ...value.dataValues,
            downloads,
            size: formatBytes(value.dataValues.size),
            category: value.get('category')
          },
          user: {
            username: req.user.get('username'),
            fullname: req.user.get('fullname')
          },
          notifications: notifications || [],
          owner,
          users,
          csrfToken: req.csrfToken(),
          panel: req.flash('panel'),
          errors: req.flash('errors'),
          categories: JSON.stringify(req.userCategories),
          canEdit,
          canSee,
          page: {
            ...details
          }
        });
      });
  });
};

// File Post by ID
exports.filePost = (req, res) => {
  const { request } = req.query;
  const { fileId } = req.params;
  const {
    title, description, category, share, filename
  } = req.body;
  if (request && request.toLowerCase() === 'download') {
    return File.findOne({ where: { id: fileId } }).then((value) => {
      const fileName = filename
        ? `${filename}${value.get('ext')}`
        : `${value.get('originalname')}${value.get('ext')}`;
      const canDownload = value.get('sharedWith').includes(req.user.get('id'))
        || value.get('userId') === req.user.get('id');
      if (!canDownload) {
        req.flash('panel', {
          type: 'danger',
          msg: 'The requested file was not found or you do not have permission to access it.'
        });
        return res.redirect('/files');
      }
      value.set('downloads', { id: req.user.get('id'), time: Date.now() });
      return value.save().then(() => {
        const filePath = path.normalize(value.get('path'));
        return res.download(filePath, fileName);
      });
    });
  }
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('errors', errors.array());
    return res.redirect(`/files/${fileId}`);
  }
  return File.findOne({ where: { id: fileId } }).then((value) => {
    value.set('title', title);
    value.set('description', description);
    value.set('category', category);
    // Share Setting
    const sharedUsernames = value.get('sharedWith');
    if (typeof share === 'undefined') value.set('sharedWith', []);
    if (typeof share === 'string') {
      const user = req.users.find(userObj => userObj.username === share);
      // Send Notifcation
      if (user && !sharedUsernames.includes(user.id)) {
        const newNotification = {
          userId: user.id,
          fileId: value.get('id'),
          title: 'New File',
          description: `New File "${title}" has been recived from ${req.user.get('fullname')}.`,
          type: 'new-file',
          link: `/files/${value.get('id')}`
        };
        Notification.findOrCreate({
          where: {
            ...newNotification
          },
          defaults: {
            ...newNotification
          }
        }).then(([noti, created]) => {
          if (noti) {
            if (noti.get('seen')) noti.set('seen', false);
            noti.save().then((upNoti) => {
              // send all Notitifcation
              sendAllNotification(req.io, user.id, upNoti.get('id'));
            });
          } else if (!noti && created) {
            // send all Notitifcation
            sendAllNotification(req.io, user.id, created.get('id'));
          }
        });
      }
      value.set('sharedWith', [user.id]);
    }
    if (Array.isArray(share)) {
      share.forEach((username) => {
        if (Array.isArray(username)) {
          req.flash('panel', {
            type: 'danger',
            msg: 'Something Went Worng. Please try again later.'
          });
          return res.redirect(`/files/${fileId}`);
        }
        const user = req.users.find(userObj => userObj.username === username);
        if (user && !sharedUsernames.includes(user.id)) {
          const newNotification = {
            userId: user.id,
            fileId: value.get('id'),
            title: 'New File',
            description: `New File "${title}" has been recived from ${req.user.get('fullname')}.`,
            type: 'new-file',
            link: `/files/${value.get('id')}`
          };
          return Notification.findOrCreate({
            where: {
              ...newNotification
            },
            defaults: {
              ...newNotification
            }
          }).then(([noti, created]) => {
            if (noti && !created) {
              if (noti.get('seen')) noti.set('seen', false);
              return noti.save().then((upNoti) => {
                // send all Notitifcation
                sendAllNotification(req.io, user.id, upNoti.get('id'));
              });
            }
            // send all Notitifcation
            return sendAllNotification(req.io, user.id, created.get('id'));
          });
        }
        return true;
      });
      value.set('sharedWith', [
        ...share.map(username => req.users.find(user => user.username === username).id)
      ]);
    }
    return value.save().then(() => {
      req.flash('panel', {
        type: 'success',
        msg: 'Details has been successfly changed.'
      });
      return res.redirect(`/files/${fileId}`);
    });
  });
};

// Delete File by id
exports.fileDelete = (req, res) => {
  const { recover, shared } = req.body;

  File.findOne({
    where: { id: req.params.fileId }
  }).then((value) => {
    if (value && shared) {
      const newSharedUsernames = value
        .get('sharedWith')
        .filter(userId => userId !== req.user.get('id'));
      value.set('sharedWith', newSharedUsernames);
      return value.save().then(() => res.json({ success: true }));
    }
    if (!value || value.get('userId') !== req.user.get('id')) {
      req.flash('panel', {
        type: 'danger',
        msg: 'The requested file was not found or you do not have permission to access it.'
      });
      return res.redirect('/files');
    }
    value.set('deleted', recover ? null : new Date().getTime());
    return value.save().then(() => res.json({ success: true }));
  });
};
