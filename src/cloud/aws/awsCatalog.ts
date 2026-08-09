import {
  Activity, Boxes, Cloud, Container, Database, Globe2, HardDrive, KeyRound,
  Network, Router, Server, Shield, Waypoints, Workflow, Bell, Gauge, LockKeyhole
} from 'lucide-react';
import type { CloudCatalog, CloudResourceItem } from '../types';
import { awsCategories } from './awsCategories';
import { awsIcon } from './awsIconSource';

const item = (
  type:string,
  label:string,
  description:string,
  category:string,
  iconCategory:string,
  iconFile:string,
  fallbackIcon:any,
  sku='Standard'
):CloudResourceItem => ({
  type,label,description,category,sku,
  iconUrl:awsIcon(iconCategory,iconFile),
  fallbackIcon,
  canvasReady:true,
});

export const awsResources:CloudResourceItem[] = [
  // Management & Governance
  item('awsCloudFormation','AWS CloudFormation','Infrastructure as code and stack orchestration','Management & Governance','ManagementGovernance','CloudFormation',Workflow),
  item('awsCloudWatch','Amazon CloudWatch','Metrics, logs, alarms and observability','Management & Governance','ManagementGovernance','CloudWatch',Gauge),
  item('awsCloudTrail','AWS CloudTrail','API activity and governance audit trail','Management & Governance','ManagementGovernance','CloudTrail',Activity),

  // Networking & Content Delivery
  item('awsVpc','Amazon VPC','Isolated virtual network for AWS resources','Networking & Content Delivery','NetworkingContentDelivery','NetworkingContentDelivery',Network),
  item('awsTransitGateway','AWS Transit Gateway','Central hub for VPC and hybrid network connectivity','Networking & Content Delivery','NetworkingContentDelivery','TransitGateway',Router),
  item('awsDirectConnect','AWS Direct Connect','Dedicated private connectivity to AWS','Networking & Content Delivery','NetworkingContentDelivery','DirectConnect',Network),
  item('awsSiteToSiteVpn','AWS Site-to-Site VPN','Encrypted VPN connectivity to AWS','Networking & Content Delivery','NetworkingContentDelivery','SitetoSiteVPN',Shield),
  item('awsCloudFront','Amazon CloudFront','Global content delivery network','Networking & Content Delivery','NetworkingContentDelivery','CloudFront',Globe2),
  item('awsRoute53','Amazon Route 53','Highly available DNS and traffic routing','Networking & Content Delivery','NetworkingContentDelivery','Route53',Globe2),
  item('awsAlb','Application Load Balancer','Layer 7 application load balancing','Networking & Content Delivery','NetworkingContentDelivery','ElasticLoadBalancingApplicationLoadBalancer',Waypoints),
  item('awsNlb','Network Load Balancer','High-performance Layer 4 load balancing','Networking & Content Delivery','NetworkingContentDelivery','ElasticLoadBalancingNetworkLoadBalancer',Waypoints),
  item('awsPrivateLink','AWS PrivateLink','Private service connectivity through VPC endpoints','Networking & Content Delivery','NetworkingContentDelivery','PrivateLink',LockKeyhole),
  item('awsApiGateway','Amazon API Gateway','Managed APIs at any scale','Networking & Content Delivery','NetworkingContentDelivery','APIGateway',Network),

  // Compute
  item('awsEc2','Amazon EC2','Resizable virtual compute capacity','Compute','Compute','EC2',Server),
  item('awsEc2AutoScaling','Amazon EC2 Auto Scaling','Automatically scale EC2 capacity','Compute','Compute','EC2AutoScaling',Server),
  item('awsLambda','AWS Lambda','Serverless event-driven compute','Compute','Compute','Lambda',Cloud),
  item('awsElasticBeanstalk','AWS Elastic Beanstalk','Application deployment and managed runtime platform','Compute','Compute','ElasticBeanstalk',Cloud),

  // Containers
  item('awsEcs','Amazon ECS','Managed container orchestration','Containers','Containers','ElasticContainerService',Container),
  item('awsEks','Amazon EKS','Managed Kubernetes service','Containers','Containers','ElasticKubernetesService',Boxes),
  item('awsEcr','Amazon ECR','Managed container image registry','Containers','Containers','ElasticContainerRegistry',Boxes),
  item('awsFargate','AWS Fargate','Serverless compute engine for containers','Containers','Containers','Fargate',Container),

  // Storage
  item('awsS3','Amazon S3','Scalable object storage','Storage','Storage','SimpleStorageService',HardDrive),
  item('awsEbs','Amazon EBS','Block storage for EC2','Storage','Storage','ElasticBlockStore',HardDrive),
  item('awsBackup','AWS Backup','Centralized data protection and backup','Storage','Storage','Backup',HardDrive),

  // Database
  item('awsRds','Amazon RDS','Managed relational database service','Database','Database','RDS',Database),
  item('awsAurora','Amazon Aurora','Cloud-native relational database','Database','Database','Aurora',Database),
  item('awsDynamoDb','Amazon DynamoDB','Serverless NoSQL key-value database','Database','Database','DynamoDB',Database),

  // Security, Identity & Compliance
  item('awsKms','AWS KMS','Managed encryption keys and cryptographic operations','Security, Identity & Compliance','SecurityIdentityCompliance','KeyManagementService',KeyRound),
  item('awsSecretsManager','AWS Secrets Manager','Securely manage application secrets','Security, Identity & Compliance','SecurityIdentityCompliance','SecretsManager',KeyRound),
  item('awsSecurityHub','AWS Security Hub','Cloud security posture and findings aggregation','Security, Identity & Compliance','SecurityIdentityCompliance','SecurityHub',Shield),
  item('awsNetworkFirewall','AWS Network Firewall','Managed network firewall for VPC','Security, Identity & Compliance','SecurityIdentityCompliance','NetworkFirewall',Shield),

  // Application Integration
  item('awsSqs','Amazon SQS','Fully managed message queues','Application Integration','ApplicationIntegration','SimpleQueueService',Workflow),
  item('awsSns','Amazon SNS','Pub/sub messaging and notifications','Application Integration','ApplicationIntegration','SimpleNotificationService',Bell),
  item('awsEventBridge','Amazon EventBridge','Serverless event bus and event routing','Application Integration','ApplicationIntegration','EventBridge',Workflow),
  item('awsStepFunctions','AWS Step Functions','Visual workflow orchestration','Application Integration','ApplicationIntegration','StepFunctions',Workflow),
];

export const awsCatalog:CloudCatalog = {
  provider:'aws',
  categories:awsCategories,
  resources:awsResources,
};
