import { useState } from "react";

const AddTodoForm: React.FC = () => {
  const [text, setText] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		await window.electron.invoke('add-todo', { text, status: 'In Progress' });
    setText('');
    // Optionally, refresh the todo list here or in the parent component
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" value={text} onChange={(e) => setText(e.target.value)} />
      <button type="submit">Add Todo</button>
    </form>
  );
};

export default AddTodoForm;
