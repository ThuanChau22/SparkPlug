export const loader = async ()=>{
  throw new Response("", { status: 403 });
};

const UserManagement = () => {
  return (<>User Management</>);
};

export default UserManagement;
