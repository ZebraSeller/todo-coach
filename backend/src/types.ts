export interface TodoItem {
  todoID: string
  taskName: string
  date: string // YYYY-MM-DD
  completed?: boolean
}

export interface UserDoc {
  username: string
  password: string
  todoList: TodoItem[]
}

