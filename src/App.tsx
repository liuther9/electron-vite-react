import UpdateElectron from '@/components/update'
import './App.css'
import AddTodoForm from './components/AddTodoForm'
import TodoList from './components/TodoList'


function App() {
  return (
    <div className='App'>
      <div className='flex-center'>
        <TodoList  />
      </div>

      {/* <UpdateElectron /> */}
    </div>
  )
}

export default App