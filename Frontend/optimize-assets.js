import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const assetsDir = 'assets';
const publicAssetsDir = 'public/assets';

async function optimize() {
  console.log('Optimizing source assets...');

  // Optimize splash screen (Source for regeneration)
  if (fs.existsSync(path.join(assetsDir, 'splash.png'))) {
    console.log('Optimizing assets/splash.png...');
    await sharp(path.join(assetsDir, 'splash.png'))
      .png({ quality: 60, palette: true, compressionLevel: 9 })
      .toFile(path.join(assetsDir, 'splash_opt.png'));
    fs.renameSync(path.join(assetsDir, 'splash_opt.png'), path.join(assetsDir, 'splash.png'));
  }

  // Optimize icon (Source for regeneration)
  if (fs.existsSync(path.join(assetsDir, 'icon.png'))) {
    console.log('Optimizing assets/icon.png...');
    await sharp(path.join(assetsDir, 'icon.png'))
      .png({ quality: 80, palette: true })
      .toFile(path.join(assetsDir, 'icon_opt.png'));
    fs.renameSync(path.join(assetsDir, 'icon_opt.png'), path.join(assetsDir, 'icon.png'));
  }

  // Optimize public assets (Used by web/app runtime)
  if (fs.existsSync(path.join(publicAssetsDir, 'bharati-sweets-icon.png'))) {
      console.log('Optimizing public/assets/bharati-sweets-icon.png...');
      await sharp(path.join(publicAssetsDir, 'bharati-sweets-icon.png'))
        .png({ quality: 80, palette: true })
        .toFile(path.join(publicAssetsDir, 'bharati-sweets-icon-opt.png'));
      fs.renameSync(path.join(publicAssetsDir, 'bharati-sweets-icon-opt.png'), path.join(publicAssetsDir, 'bharati-sweets-icon.png'));
  }

  if (fs.existsSync(path.join(publicAssetsDir, 'login.jpg'))) {
    console.log('Optimizing public/assets/login.jpg...');
    await sharp(path.join(publicAssetsDir, 'login.jpg'))
      .jpeg({ quality: 75, progressive: true })
      .toFile(path.join(publicAssetsDir, 'login-opt.jpg'));
    fs.renameSync(path.join(publicAssetsDir, 'login-opt.jpg'), path.join(publicAssetsDir, 'login.jpg'));
  }

  console.log('Optimization complete.');
}

optimize().catch(console.error);
