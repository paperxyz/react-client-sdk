import styled from 'styled-components';

export const Button = styled.button`
  font-weight: bold;
  display: flex;
  align-items: center;
  background-color: #01212b;
  color: #fff;
  padding: 13px 35px;
  border-radius: 10px;
  transition: all 0.1s ease-in-out;
  &:hover {
    background-color: #013140;
    transform: scale(1.01);
  }
  &:active {
    background-color: #011e26;
    transform: scale(1);
  }
`;
