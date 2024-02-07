import { useState } from 'react';
import s from './todoitem.module.css'

interface TodoItemProps {
  todo: {
    id: number;
    text: string;
    status: 'Done' | 'In Progress';
	};
	refreshTodos: () => Promise<void>;
}

const TodoItem: React.FC<TodoItemProps> = ({ todo, refreshTodos }) => {
	const [edit, setEdit] = useState(false)
	const [value, setValue] = useState(todo.text)
	const handleDelete = async () => {
		try {
			await window.electron.invoke('delete-todo', { id: todo.id });
			await refreshTodos();
		} catch (error) {
			
		}
	};
	
	const handleUpdate = async (text: string, status: 'Done' | 'In Progress') => {
		await window.electron.invoke('update-todo', { id: todo.id, text, status });
		await refreshTodos();
		// Refresh or notify as needed
	};

	const handleEdit = async () => {
		if (edit) {
			await window.electron.invoke('update-todo', { ...todo, text: value })
			await refreshTodos();
		}
		setEdit(!edit)
	}

  return (
    <div className={s.container}>
			{!edit && <span>{todo.text}</span>}
			{edit && <input type='text' value={value} onChange={e => setValue(e.target.value)} />}
			<div className={s.controls}>
				<button onClick={() => handleUpdate(todo.text, todo.status === 'Done'? 'In Progress' : 'Done')}>{todo.status}</button>
				<button onClick={handleEdit}>{!edit ? 'Edit' : 'Save'}</button>
				<button onClick={handleDelete}>Delete</button>
			</div>
    </div>
  );
};

export default TodoItem;
