import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { release } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { update } from './update'

// DATABASE
import Database from 'better-sqlite3';

const userDataPath = app.getPath('userData');
const dbFilePath = join(userDataPath, 'todo.db');

const db = new Database(dbFilePath, { verbose: console.log });
db.pragma('journal_mode = WAL');

const initDB = () => {
  db.prepare(`CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT,
    status TEXT
  )`).run();
  const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='todos'").get();
    if (tableExists) {
      console.log('tableExists');
    } else {
      console.error('Todo table does not exist.');
    }
};

const addTodo = (text: string, status: 'Done' | 'In Progress') => {
  const stmt = db.prepare('INSERT INTO todos (text, status) VALUES (?, ?)');
  const info = stmt.run(text, status);
  return info.lastInsertRowid;
};

const getTodos = () => {
  return db.prepare('SELECT * FROM todos').all();
};

const updateTodo = (id: number, text: string, status: 'Done' | 'In Progress') => {
  db.prepare('UPDATE todos SET text = ?, status = ? WHERE id = ?').run(text, status, id);
};

interface Todo {
  id: number;
  text: string;
  status: 'Done' | 'In Progress';
}

const toggleTodoStatus = (id: number) => {
  const todo = db.prepare('SELECT status FROM todos WHERE id = ?').get(id) as Todo;
  const newStatus = todo.status === 'Done' ? 'In Progress' : 'Done';
  db.prepare('UPDATE todos SET status = ? WHERE id = ?').run(newStatus, id);
};

const deleteTodo = (id: number) => {
  db.prepare('DELETE FROM todos WHERE id = ?').run(id);
};

// DATABASE

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs    > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.DIST_ELECTRON = join(__dirname, '../')
process.env.DIST = join(process.env.DIST_ELECTRON, '../dist')
process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? join(process.env.DIST_ELECTRON, '../public')
  : process.env.DIST

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win: BrowserWindow | null = null
// Here, you can also use other preload
const preload = join(__dirname, '../preload/index.mjs')
const url = process.env.VITE_DEV_SERVER_URL
const indexHtml = join(process.env.DIST, 'index.html')

async function createWindow() {
  win = new BrowserWindow({
    title: 'Main window',
    icon: join(process.env.VITE_PUBLIC, 'favicon.ico'),
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // nodeIntegration: true,

      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      // contextIsolation: false,
    },
  })

  if (url) { // electron-vite-vue#298
    win.loadURL(url)
    // Open devTool if the app is not packaged
    win.webContents.openDevTools()
  } else {
    win.loadFile(indexHtml)
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })

  // Apply electron-updater
  update(win)
}

app.whenReady().then(() => {
  createWindow();
  initDB();

  ipcMain.handle('add-todo', async (event, {text, status}) => {
    const id = addTodo(text, status);
    return id;
  });

  ipcMain.handle('get-todos', async (event) => {
    const todos = getTodos();
    return todos;
  });

  ipcMain.handle('update-todo', async (event, {id, text, status}) => {
    updateTodo(id, text, status);
    return;
  });

  ipcMain.handle('delete-todo', async (event, {id}) => {
    deleteTodo(id);
    return;
  });
})

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${url}#${arg}`)
  } else {
    childWindow.loadFile(indexHtml, { hash: arg })
  }
})

