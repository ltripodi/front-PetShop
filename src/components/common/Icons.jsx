import SvgIcon from '@mui/material/SvgIcon';

export function PawIcon(props) {
  return (
    <SvgIcon viewBox="0 0 32 32" {...props}>
      <ellipse cx="7" cy="12" rx="3" ry="4" transform="rotate(-25 7 12)" />
      <ellipse cx="13" cy="7.5" rx="3" ry="4" transform="rotate(-8 13 7.5)" />
      <ellipse cx="20" cy="7.5" rx="3" ry="4" transform="rotate(8 20 7.5)" />
      <ellipse cx="26" cy="12" rx="3" ry="4" transform="rotate(25 26 12)" />
      <path d="M16.5 13.5c-3.7 0-5 2.7-7.6 5.3-1.8 1.8-2.2 4.1-.8 5.9 1.7 2.2 4.1 1.2 6.1.5 1.5-.5 3-.5 4.5 0 2 .7 4.4 1.7 6.1-.5 1.4-1.8 1-4.1-.8-5.9-2.5-2.6-3.9-5.3-7.5-5.3Z" />
    </SvgIcon>
  );
}

export function MenuIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
    </SvgIcon>
  );
}

export function CloseIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="m18.3 5.7-1.4-1.4L12 9.2 7.1 4.3 5.7 5.7l4.9 4.9-4.9 4.9 1.4 1.4 4.9-4.9 4.9 4.9 1.4-1.4-4.9-4.9z" transform="translate(0 1.4)" />
    </SvgIcon>
  );
}
