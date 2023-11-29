export const loader = async ()=>{
  throw new Response("", { status: 403 });
};

const UserAnalytics = () => {
  return (<>User Analytics</>);
};

export default UserAnalytics;
