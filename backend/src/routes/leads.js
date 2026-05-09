const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/leadsController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.get('/',           auth, ctrl.list);
router.post('/',          auth, ctrl.create);
router.get('/stats',      auth, ctrl.stats);
router.get('/:id',        auth, ctrl.get);
router.put('/:id',        auth, ctrl.update);
router.delete('/:id',     auth, ctrl.remove);
router.post('/:id/contact', auth, ctrl.contact);
router.post('/import/csv', auth, upload.single('file'), ctrl.importCSV);
module.exports = router;
