const RVW_SUMMIT = (function () {
  const date = new Date();
  const year = date.getFullYear();

  let selectedYear = null;

  const summits = {
    '2019': {
      location: 'Nashville, TN',
      description: 'Scavanger Hunt, Music & Drinks and some Fancy Meals',
      startDate: new Date('2019-05-13'),
      endDate: new Date('2019-05-15')
    },
    '2018': {
      location: 'Chicago, IL',
      description: 'SFCC Connections Conference, Game Night at the Chicago Athletic Club & some Nice Dinners',
      startDate: new Date('2018-06-10'),
      endDate: new Date('2018-06-14')
    },
    '2017': {
      location: 'New Orleans, LA',
      description: 'Riverboat Cruise, Escape Room & some Good Meals',
      startDate: new Date('2017-09-13'),
      endDate: new Date('2017-09-15')
    },
    '2016': {
      location: 'Napa Valley, CA',
      description: 'Wine Tastings, Winery Tour & some Good Eats',
      startDate: new Date('2016-10-05'),
      endDate: new Date('2016-10-07')
    },
    '2015': {
      location: 'Grand Rapids, MI',
      description: 'Very First RVW Summit',
      startDate: new Date('2015-10-12'),
      endDate: new Date('2015-10-16')
    }
  };

  const $selector = document.getElementById('album-selector');
  const $gallery = document.getElementById('album-gallery');
  const $add = document.getElementById('add-photo');
  const $addLabel = document.getElementById('add-photo-label');
  const $homeButton = document.getElementById('home-button');
  const $loader = document.getElementById('loader');
  const $noImages = document.getElementById('no-images');

  /**
   * Setup Public AWS Access
   */
  const bucketName = 'rvw-summit';
  const bucketRegion = 'us-east-1';
  const identityPoolId = 'us-east-1:7f0b2f41-ccf6-4a9e-8be4-264db0704051';

  AWS.config.update({
    region: bucketRegion,
    credentials: new AWS.CognitoIdentityCredentials({
      IdentityPoolId: identityPoolId
    })
  });

  const s3 = new AWS.S3({
    apiVersion: '2006-03-01',
    params: { Bucket: bucketName }
  });

  /**
   * Create Album for Selected Year
   * @param  {Number} album
   */
  const checkAlbumExists = function(album, callback) {
    const albumKey = album.toString() + '/';
    s3.headObject({ Key: albumKey }, function(err, data) {
      // If no error, album exists
      if (!err) {
        if (typeof callback === 'function') {
          callback()
        }
        return
      }

      // If there was an error, but the code is NotFound, we had issues accessing the bucket
      if (err.code !== 'NotFound') {
        console.error('There was an error creating your album: ' + err.message);
        return
      }

      // Create the album in the bucket
      s3.putObject({Key: albumKey}, function(err, data) {
        if (err) {
          console.error('There was an error creating your album: ' + err.message);
        } else if (typeof callback === 'function') {
          callback()
        }
      });
    });
  }

  const slugify = function(text, separator) {
    text = text.toString().toLowerCase().trim();

    const sets = [
      {to: 'a', from: '[ÀÁÂÃÄÅÆĀĂĄẠẢẤẦẨẪẬẮẰẲẴẶ]'},
      {to: 'c', from: '[ÇĆĈČ]'},
      {to: 'd', from: '[ÐĎĐÞ]'},
      {to: 'e', from: '[ÈÉÊËĒĔĖĘĚẸẺẼẾỀỂỄỆ]'},
      {to: 'g', from: '[ĜĞĢǴ]'},
      {to: 'h', from: '[ĤḦ]'},
      {to: 'i', from: '[ÌÍÎÏĨĪĮİỈỊ]'},
      {to: 'j', from: '[Ĵ]'},
      {to: 'ij', from: '[Ĳ]'},
      {to: 'k', from: '[Ķ]'},
      {to: 'l', from: '[ĹĻĽŁ]'},
      {to: 'm', from: '[Ḿ]'},
      {to: 'n', from: '[ÑŃŅŇ]'},
      {to: 'o', from: '[ÒÓÔÕÖØŌŎŐỌỎỐỒỔỖỘỚỜỞỠỢǪǬƠ]'},
      {to: 'oe', from: '[Œ]'},
      {to: 'p', from: '[ṕ]'},
      {to: 'r', from: '[ŔŖŘ]'},
      {to: 's', from: '[ßŚŜŞŠ]'},
      {to: 't', from: '[ŢŤ]'},
      {to: 'u', from: '[ÙÚÛÜŨŪŬŮŰŲỤỦỨỪỬỮỰƯ]'},
      {to: 'w', from: '[ẂŴẀẄ]'},
      {to: 'x', from: '[ẍ]'},
      {to: 'y', from: '[ÝŶŸỲỴỶỸ]'},
      {to: 'z', from: '[ŹŻŽ]'},
      {to: '-', from: '[·/_,:;\']'}
    ];

    sets.forEach(set => {
      text = text.replace(new RegExp(set.from,'gi'), set.to);
    });

    text = text.toString().toLowerCase()
      .replace(/\s+/g, '-')         // Replace spaces with -
      .replace(/&/g, '-and-')       // Replace & with 'and'
      .replace(/[^\w\-]+/g, '')     // Remove all non-word chars
      .replace(/\--+/g, '-')        // Replace multiple - with single -
      .replace(/^-+/, '')           // Trim - from start of text
      .replace(/-+$/, '');          // Trim - from end of text

    if ((typeof separator !== 'undefined') && (separator !== '-')) {
      text = text.replace(/-/g, separator);
    }

    return text;
  }

  /**
   * Add Photo to Given Album
   * @return {[type]}           [description]
   */
  const addPhoto = function (dropped) {
    $loader.classList.add('show');

    // Check if this was an Event of FileList
    var files = (dropped instanceof FileList) ? dropped : document.getElementById('add-photo').files;

    if (!files.length) {
      $loader.classList.remove('show');
      return alert('Please choose a file to upload first.');
    }

    var uploaded = 0;
    var checkComplete = function () {
      uploaded += 1;

      if (uploaded === files.length) {
        uploaded = 0;
        window.location.reload();
      }
    };

    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      var ext = file.name.substr(file.name.lastIndexOf('.') + 1);
      var fileName = Date.now().toString() + '-' + slugify(file.name.replace(ext, '')) + '.' + ext;
      var albumPhotosKey = selectedYear.toString() + '/';
      var photoKey = albumPhotosKey + fileName;

      // Make sure file size is not larger than 5MB
      // @TODO: Add support for `s3.createMultipartUpload`
      if (file.size < 5242880) {
        s3.upload({
          Key: photoKey,
          Body: file,
          ACL: 'public-read'
        }, function(err, data) {
          if (err) {
            $loader.classList.remove('show');
            return alert('There was an error uploading your photo: ', err.message);
          }

          checkComplete();
        });
      } else {
        $loader.classList.remove('show');
        alert('Image file size must be less than 5MB.');
      }
    }
  };

  const fetchAlbum = function (callback) {
    const albumPhotosKey = selectedYear + '/';
    s3.listObjects({Prefix: albumPhotosKey}, function(err, data) {
      if (err) {
        return alert('There was an error viewing your album: ' + err.message);
      }

      const href = this.request.httpRequest.endpoint.href;
      const bucketUrl = href + bucketName + '/';
      const photos = data.Contents.map(function(photo) {
        const key = albumPhotosKey + encodeURIComponent(photo.Key.replace(albumPhotosKey, ''));
        return {
          key: key,
          url: bucketUrl + key
        };
      });

      const gallery = photos.filter(function (img) {
        return img.key !== albumPhotosKey;
      });

      if (typeof callback === 'function') {
        callback(gallery);
      }
    });
  };

  const listSummits = function () {
    selectedYear = null;

    const albums = Object.keys(summits).sort().reverse();

    $selector.innerHTML = '';

    for (const album of albums) {
      var elm = document.createElement('div');

      elm.innerHTML = `<div class="album-year">
        <a href="javascript:void(0);" onclick="RVW_SUMMIT.selectAlbum('${album}'); return false;">
          <h1>${album}</h1>
          <p class="date">${moment(summits[album].startDate).format('MMM Do')} - ${moment(summits[album].endDate).format('MMM Do')}</p>
          <p class="location">${summits[album].location}</p>
          <p class="description">${summits[album].description}</p>
        </a>
      </div>`;

      $selector.appendChild(elm);

      $selector.style.display = 'grid';
      $gallery.style.display = 'none';
      $addLabel.style.display = 'none';
      $homeButton.innerHTML = 'RVW Summit';
      $loader.classList.remove('show');
    }
  };

  /**
   * Select Album
   * @param  {string} album   Selected Album
   * @param  {boolean} skipNav Whether to Skip using Push State
   */
  const selectAlbum = function (album, skipNav) {
    if (!skipNav) {
      window.history.pushState(null, `RVW Summit ${album}`, `/${album}`);
    }

    selectedYear = album;

    checkAlbumExists(selectedYear, function() {
      fetchAlbum(function (photos) {
        generateAlbum(photos);
      })
    });

    $selector.style.display = 'none';
    $gallery.style.display = 'grid';
    $addLabel.style.display = 'block';
    $homeButton.innerHTML = '&lsaquo;&nbsp; Back';
    $loader.classList.add('show');
  };

  const generateAlbum = function (photos) {
    $gallery.innerHTML = '';

    if (photos.length === 0) {
      $noImages.style.display = 'block';
    } else {
      $noImages.style.display = 'none';

      for (var i = 0; i < photos.length; i++) {
        var elm = document.createElement('div');
        var photo = photos[i];
        var img375 = photo.url.replace('https://s3.amazonaws.com/rvw-summit/', 'https://dipla1vjmucik.cloudfront.net/375x375/smart/filters:quality(80)/');
        var img480 = photo.url.replace('https://s3.amazonaws.com/rvw-summit/', 'https://dipla1vjmucik.cloudfront.net/480x480/smart/filters:quality(80)/');
        var img800 = photo.url.replace('https://s3.amazonaws.com/rvw-summit/', 'https://dipla1vjmucik.cloudfront.net/800x800/smart/filters:quality(80)/');

        elm.innerHTML = `<div class="album-image" data-responsive="${img375} 375, ${img480} 480, ${img800} 800" data-src="${photo.url}" data-sub-html="<h4>${selectedYear} - ${summits[selectedYear].location}</h4><p>${summits[selectedYear].description}</p>">
          <a href="${photo.url}" style="background-image: url('${img800}'), linear-gradient(#1b1b15, #000000)">
            <img src="${img375}">
          </a>
        </div>`;

        $gallery.appendChild(elm);
      }

      // Trigger Light Gallery
      $('#album-gallery').lightGallery({
        selector: '.album-image'
      });
    }

    $loader.classList.remove('show');
  };

  /**
   * Load Page based in URL
   */
  const loadURL = function() {
    let path = window.location.pathname.split('/');
    let params = path.filter(function (el) {
      return el !== '';
    });

    if (params.length === 0) {
      listSummits();
    } else if (params.length === 1) {
      selectAlbum(params[0], true);
    } else if (params.length === 2) {
      console.log('Load Image in Album', params[0], params[1]);
    }
  };

  const dragenter = function(e) {
    e.stopPropagation();
    e.preventDefault();

    $addLabel.classList.add('active');
  };

  const dragover = function(e) {
    e.stopPropagation();
    e.preventDefault();

    $addLabel.classList.add('active');
  };

  const dragleave = function(e) {
    e.stopPropagation();
    e.preventDefault();

    $addLabel.classList.remove('active');
  };

  const dragexit = function(e) {
    e.stopPropagation();
    e.preventDefault();

    $addLabel.classList.remove('active');
  };

  const drop = function(e) {
    e.stopPropagation();
    e.preventDefault();

    const dt = e.dataTransfer;
    const files = dt.files;

    addPhoto(files);

    $addLabel.classList.remove('active');
  };

  /**
   * Initialize Gallery
   */
  const init = function () {
    loadURL();
    window.addEventListener('popstate', loadURL);
    $add.addEventListener('change', addPhoto);

    // Support Drag & Drop
    $addLabel.addEventListener('dragenter', dragenter, false);
    $addLabel.addEventListener('dragover', dragover, false);
    $addLabel.addEventListener('dragleave', dragleave, false);
    $addLabel.addEventListener('dragexit', dragexit, false);
    $addLabel.addEventListener('drop', drop, false);
  }

  return {
    init: init,
    selectAlbum: selectAlbum
  }
})();

window.onload = RVW_SUMMIT.init();
