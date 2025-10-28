import EmployeeAccessProvider from './EmployeeAccessProvider';

export default function EmployeeLayout({ children }) {
  return (
    <EmployeeAccessProvider>
      {children}
    </EmployeeAccessProvider>
  );
}
