import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  userGetAll,
  selectUserList,
} from "redux/user/userSlide";

const UserManagement = () => {
  const userList = useSelector(selectUserList);
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(userGetAll());
  }, []);
  return (
    <>
      {userList.map(({ id, name, email }) => {
        return (
          <div key={id}>
            {id}: {name} - {email}
          </div>
        );
      })}
    </>
  );
};

export default UserManagement;
