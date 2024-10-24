import { execSync } from "child_process"
import fs from "fs"
import { resolve } from "path"

const sourceDir = process.cwd()
const packagesDir = resolve(sourceDir, 'packages')

const generatePackageLock = (dir) => {
  try {
    const pnpmLockFile = resolve(dir, 'pnpm-lock.yaml')
    if (fs.existsSync(pnpmLockFile)) {
      // Если файл pnpm-lock.yaml существует, просто выполняем преобразование
      execSync('npx pnpm-lock-to-npm-lock ./pnpm-lock.yaml', { cwd: dir })
    } else {
      // Если файл не найден, сначала запускаем pnpm install
      execSync('pnpm i', { cwd: dir })
      execSync('npx pnpm-lock-to-npm-lock ./pnpm-lock.yaml', { cwd: dir })
    }
    console.log(`package-lock.json was successfully created in ${dir}`)
  } catch (error) {
    console.error(`Error generating package-lock in ${dir}:`, error)
  }
}

const updatePackageLockName = (filePath, newName) => {
  try {
    if (fs.existsSync(filePath)) {
      const packageLockData = fs.readFileSync(filePath, 'utf-8')
      const packageLockJson = JSON.parse(packageLockData)
      packageLockJson.name = newName;
      fs.writeFileSync(filePath, JSON.stringify(packageLockJson, null, 2), 'utf-8')
      console.log(`Updated "name" field in ${filePath}`)
    } else {
      console.error(`File ${filePath} does not exist.`)
    }
  } catch (error) {
    console.error(`Error updating package-lock.json name in ${filePath}: ${error.message}`)
  }
}

const processProjects = () => {
  // Генерируем package-lock.json для корневого проекта
  generatePackageLock(sourceDir)
  const rootPackageLockPath = resolve(sourceDir, 'package-lock.json')
  updatePackageLockName(rootPackageLockPath, "Express")

  // Проверяем наличие папки с подпроектами
  if (fs.existsSync(packagesDir)) {
    const subProjects = fs.readdirSync(packagesDir).filter(name => {
      const subDir = resolve(packagesDir, name)
      return fs.statSync(subDir).isDirectory()
    })

    // Генерируем package-lock.json для каждого подпроекта
    for (const project of subProjects) {
      const projectDir = resolve(packagesDir, project)
      generatePackageLock(projectDir)

      const projectPackageLockPath = resolve(projectDir, 'package-lock.json')
      updatePackageLockName(projectPackageLockPath, project)
    }
  } else {
    console.error(`Directory ${packagesDir} does not exist.`)
  }
}

processProjects()
