import React, { useEffect, useState } from 'react';
import TodoItem from '../ToDoItem';
import s from './todolist.module.css'

interface Todo {
  id: number;
  text: string;
  status: 'Done' | 'In Progress';
}

const TodoList: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [text, setText] = useState('');

	const fetchTodos = async () => {
		const fetchedTodos = await window.electron.invoke('get-todos');
		setTodos(fetchedTodos);
	};

  const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		await window.electron.invoke('add-todo', { text, status: 'In Progress' });
		await fetchTodos();
    setText('');
    // Optionally, refresh the todo list here or in the parent component
  };

  useEffect(() => {
    fetchTodos();
  }, []);
  return (
		<div className={s.container}>
			
			<form onSubmit={handleSubmit}>
      <input type="text" value={text} onChange={(e) => setText(e.target.value)} />
      <button type="submit">Add Todo</button>
    </form>
      {todos.map(todo => (
        <TodoItem
          key={todo.id}
					todo={todo}
					refreshTodos={fetchTodos}
        />
      ))}
    </div>
  );
};

export default TodoList;
