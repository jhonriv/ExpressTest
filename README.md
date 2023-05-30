# ExpressTest

Practica de Express: Crear un CRUD de usuarios utlizando:
- commonJS
- Guardar y editar los datos en un archivo .json
- Crear autenticacion basica
- Crear 3 niveles de usuarios: admin (1 solo admin por defecto), manager y user
- Admin no puede ser borrado, el admin no puede crear mas admin, tiene permisos para:
  - crear usuarios con nivel manager o user
  - buscar todos los usuarios
  - buscar un usuario especifico
  - editar cualquier usuario (incluido el mismo)
  - borrar un usuario
  - borrar todos lod usuarios
- Manager tiene permisos para:
  - buscar usuarios que haya creado
  - editar usuarios que haya creado
  - eliminar usuarios que haya creado
- User tiene permiso para: 
  - ver su informacion
- Los usuarios deben tener la siguiente validacion:
  - el usuario debe tener los campos
  - { username: string, password: string, role: enum["admin", "manager", "user"], users: string[] }
  - username, password y role deben ser requeridos
  - username debe ser unico en todo el sistema
