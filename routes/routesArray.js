const routes = [
  {
    id: 'home',
    title: 'Home',
    path: '/',
    inHeader: true,
    position: 1,
    active: false
  },
  {
    id: 'files',
    title: 'Files',
    path: '/files',
    inHeader: true,
    position: 2,
    active: false,
    items: [
      {
        id: 'uploaded-files',
        title: 'Uploaded Files',
        path: '/',
        inHeader: true,
        position: 1,
        active: false
      },
      {
        id: 'recived-files',
        title: 'Recived Files',
        path: '/shared',
        inHeader: true,
        position: 2,
        active: false
      },
      {
        id: 'deleted-files',
        title: 'Deleted Files',
        path: '/deleted',
        inHeader: true,
        position: 3,
        active: false
      },
      {
        id: 'new-file',
        title: 'New File',
        path: '/new',
        inHeader: false,
        position: 0,
        active: false
      },
      {
        id: 'file-info',
        title: 'File Information',
        path: '#',
        inHeader: false,
        positions: 0,
        active: false
      }
    ]
  },
  {
    id: 'profile',
    title: 'Profile',
    path: '/profile',
    inHeader: true,
    position: 3,
    active: false
  }
];

module.exports = [...routes];
