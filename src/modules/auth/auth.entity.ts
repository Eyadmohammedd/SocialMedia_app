


export interface ILoginResponse{
    email: string;
    password: string;
}



export interface IsignupResponse extends ILoginResponse{
    username: string;
    _id: string;
}
