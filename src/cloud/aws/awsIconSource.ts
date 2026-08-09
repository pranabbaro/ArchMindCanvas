export const AWS_ARCHITECTURE_ICON_SOURCE =
  'https://aws.amazon.com/architecture/icons/';

export const AWS_ICON_REPOSITORY =
  'https://github.com/awslabs/aws-icons-for-plantuml';

export const AWS_ICON_BASE =
  'https://raw.githubusercontent.com/awslabs/aws-icons-for-plantuml/main/dist';

export const awsIcon = (category:string,file:string) =>
  `${AWS_ICON_BASE}/${category}/${file}.png`;
