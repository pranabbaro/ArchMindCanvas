import type { PropertyField } from '../../resourceSchemas';
import type { ResourceType } from '../../types';

const regions=['us-east-1','us-east-2','us-west-1','us-west-2','ap-south-1','ap-south-2','ap-southeast-1','ap-southeast-2','eu-west-1','eu-west-2','eu-central-1'];
const azs=['a','b','c'];
const common=(region=true):PropertyField[]=>[
 ...(region?[{key:'region',label:'AWS Region',type:'select' as const,group:'Main parameters',required:true,options:regions,defaultValue:'ap-south-1'}]:[]),
 {key:'owner',label:'Owner',type:'text',group:'Metadata',placeholder:'Cloud platform team'},
];
const ref=(key:string,label:string,types:ResourceType[],group='Relationships'):PropertyField=>({key,label,type:'resourceRef',group,allowedResourceTypes:types,referenceAttribute:'id'});
const text=(key:string,label:string,group='Main parameters',defaultValue=''):PropertyField=>({key,label,type:'text',group,defaultValue});
const num=(key:string,label:string,group='Main parameters',defaultValue=0):PropertyField=>({key,label,type:'number',group,defaultValue});
const bool=(key:string,label:string,group='Main parameters',defaultValue=false):PropertyField=>({key,label,type:'boolean',group,defaultValue});
const sel=(key:string,label:string,options:string[],group='Main parameters',defaultValue?:string):PropertyField=>({key,label,type:'select',group,options,defaultValue:defaultValue??options[0]});
const area=(key:string,label:string,group='Main parameters'):PropertyField=>({key,label,type:'textarea',group});

const schemas:Partial<Record<ResourceType,PropertyField[]>>={
 awsAccount:[
  ...common(false),
  text('accountId','AWS Account ID','Main parameters'),
  text('accountAlias','Account alias','Main parameters'),
  text('organizationId','AWS Organizations ID','Governance'),
  text('billingOwner','Billing owner','Governance'),
 ],
 awsVpc:[
  ...common(),
  ref('awsAccountRef','AWS Account',['awsAccount']),
  text('cidrBlock','IPv4 CIDR block','Networking','10.0.0.0/16'),
  bool('enableDnsSupport','DNS resolution','Networking',true),
  bool('enableDnsHostnames','DNS hostnames','Networking',true),
  sel('instanceTenancy','Instance tenancy',['default','dedicated'],'Networking','default'),
  bool('ipv6Enabled','IPv6 CIDR','Networking',false),
 ],
 awsSubnet:[
  ...common(),
  ref('vpcRef','Amazon VPC',['awsVpc']),
  text('cidrBlock','IPv4 CIDR block','Networking','10.0.1.0/24'),
  sel('availabilityZone','Availability Zone',azs.map(x=>`ap-south-1${x}`),'Networking','ap-south-1a'),
  sel('subnetType','Subnet type',['Private','Public','Isolated'],'Networking','Private'),
  bool('mapPublicIpOnLaunch','Auto-assign public IPv4','Networking',false),
  bool('ipv6Native','IPv6-only subnet','Networking',false),
 ],
 awsEc2:[
  ...common(),
  ref('subnetRef','Subnet',['awsSubnet']),
  text('amiId','AMI ID','Compute','ami-xxxxxxxx'),
  sel('instanceType','Instance type',['t3.micro','t3.small','t3.medium','m6i.large','m6i.xlarge','c6i.large','r6i.large'],'Compute','t3.micro'),
  text('keyName','Key pair','Access'),
  area('securityGroupIds','Security group IDs','Networking'),
  bool('associatePublicIp','Associate public IPv4','Networking',false),
  num('rootVolumeSize','Root volume (GiB)','Storage',30),
  sel('rootVolumeType','Root volume type',['gp3','gp2','io2','st1'],'Storage','gp3'),
  bool('ebsOptimized','EBS optimized','Storage',true),
  text('iamInstanceProfile','IAM instance profile','Identity'),
  text('userData','User data','Advanced'),
 ],
 awsEc2AutoScaling:[
  ...common(), text('launchTemplate','Launch template','Compute'), num('minSize','Minimum capacity','Scale',1), num('desiredCapacity','Desired capacity','Scale',2), num('maxSize','Maximum capacity','Scale',4), area('subnetIds','Subnet IDs','Networking'), text('healthCheckType','Health check type','Scale','EC2')
 ],
 awsLambda:[
  ...common(), sel('runtime','Runtime',['python3.12','nodejs20.x','java21','dotnet8','provided.al2023'],'Compute','python3.12'), text('handler','Handler','Compute','lambda_function.lambda_handler'), num('memorySize','Memory (MB)','Compute',512), num('timeout','Timeout (seconds)','Compute',30), text('roleArn','Execution role ARN','Identity'), area('environmentVariables','Environment variables','Configuration'), area('subnetIds','VPC subnet IDs','Networking'), area('securityGroupIds','Security group IDs','Networking')
 ],
 awsElasticBeanstalk:[
  ...common(), text('platformArn','Platform / solution stack','Application'), text('applicationName','Application name','Application'), text('environmentName','Environment name','Application'), sel('environmentTier','Environment tier',['WebServer','Worker'],'Application','WebServer'), text('instanceType','Instance type','Compute','t3.small')
 ],
 awsEcs:[
  ...common(), text('clusterName','Cluster name','Containers'), sel('capacityProvider','Capacity provider',['FARGATE','FARGATE_SPOT','EC2'],'Containers','FARGATE'), bool('containerInsights','Container Insights','Monitoring',true), area('subnetIds','Subnet IDs','Networking'), area('securityGroupIds','Security group IDs','Networking')
 ],
 awsEks:[
  ...common(), text('kubernetesVersion','Kubernetes version','Containers','1.31'), text('clusterRoleArn','Cluster IAM role ARN','Identity'), area('subnetIds','Cluster subnet IDs','Networking'), area('securityGroupIds','Security group IDs','Networking'), bool('privateEndpoint','Private API endpoint','Networking',true), bool('publicEndpoint','Public API endpoint','Networking',false), bool('controlPlaneLogs','Control plane logging','Monitoring',true)
 ],
 awsEcr:[
  ...common(false), text('repositoryName','Repository name','Containers'), sel('imageTagMutability','Tag mutability',['MUTABLE','IMMUTABLE'],'Containers','IMMUTABLE'), bool('scanOnPush','Scan on push','Security',true), sel('encryptionType','Encryption',['AES256','KMS'],'Security','AES256')
 ],
 awsFargate:[
  ...common(), sel('orchestrator','Orchestrator',['ECS','EKS'],'Containers','ECS'), text('cpu','CPU units','Compute','512'), text('memory','Memory (MiB)','Compute','1024'), area('subnetIds','Subnet IDs','Networking'), area('securityGroupIds','Security group IDs','Networking')
 ],
 awsS3:[
  ...common(false), text('bucketName','Bucket name','Storage'), bool('versioning','Versioning','Data protection',true), sel('encryption','Default encryption',['SSE-S3','SSE-KMS'],'Security','SSE-S3'), text('kmsKeyArn','KMS key ARN','Security'), bool('blockPublicAccess','Block all public access','Security',true), sel('objectOwnership','Object ownership',['BucketOwnerEnforced','BucketOwnerPreferred','ObjectWriter'],'Security','BucketOwnerEnforced'), bool('lifecycleEnabled','Lifecycle rules','Data protection',false), bool('accessLogging','Server access logging','Monitoring',false)
 ],
 awsEbs:[
  ...common(), sel('volumeType','Volume type',['gp3','gp2','io2','st1','sc1'],'Storage','gp3'), num('sizeGiB','Size (GiB)','Storage',100), num('iops','IOPS','Performance',3000), num('throughput','Throughput (MiB/s)','Performance',125), bool('encrypted','Encrypted','Security',true), text('kmsKeyArn','KMS key ARN','Security'), text('availabilityZone','Availability Zone','Placement','ap-south-1a')
 ],
 awsBackup:[
  ...common(), text('vaultName','Backup vault','Backup'), text('planName','Backup plan','Backup'), text('schedule','Backup schedule','Backup','cron(0 5 ? * * *)'), num('retentionDays','Retention days','Backup',35), bool('crossRegionCopy','Cross-region copy','Resilience',false), text('kmsKeyArn','KMS key ARN','Security')
 ],
 awsRds:[
  ...common(), sel('engine','Engine',['postgres','mysql','mariadb','oracle-ee','sqlserver-se'],'Database','postgres'), text('engineVersion','Engine version','Database'), sel('instanceClass','DB instance class',['db.t4g.micro','db.t4g.small','db.m6g.large','db.r6g.large'],'Compute','db.t4g.micro'), num('allocatedStorage','Storage (GiB)','Storage',100), sel('storageType','Storage type',['gp3','io1','io2'],'Storage','gp3'), bool('multiAz','Multi-AZ','Resilience',true), bool('storageEncrypted','Storage encryption','Security',true), text('kmsKeyId','KMS key','Security'), area('subnetIds','DB subnet group / subnet IDs','Networking'), area('securityGroupIds','VPC security groups','Networking'), bool('publiclyAccessible','Publicly accessible','Networking',false), num('backupRetentionPeriod','Backup retention (days)','Backup',7), text('preferredBackupWindow','Backup window','Backup')
 ],
 awsAurora:[
  ...common(), sel('engine','Engine',['aurora-postgresql','aurora-mysql'],'Database','aurora-postgresql'), text('engineVersion','Engine version','Database'), sel('instanceClass','Instance class',['db.t4g.medium','db.r6g.large','db.r7g.large'],'Compute','db.r6g.large'), num('instances','Cluster instances','Scale',2), bool('serverlessV2','Aurora Serverless v2','Scale',false), num('minAcu','Minimum ACU','Scale',0.5), num('maxAcu','Maximum ACU','Scale',8), area('subnetIds','DB subnet IDs','Networking'), area('securityGroupIds','Security groups','Networking'), bool('storageEncrypted','Encryption','Security',true), num('backupRetentionPeriod','Backup retention (days)','Backup',7)
 ],
 awsDynamoDb:[
  ...common(false), text('tableName','Table name','Database'), sel('billingMode','Billing mode',['PAY_PER_REQUEST','PROVISIONED'],'Capacity','PAY_PER_REQUEST'), text('partitionKey','Partition key','Keys','id'), text('sortKey','Sort key','Keys'), bool('pointInTimeRecovery','Point-in-time recovery','Backup',true), sel('tableClass','Table class',['STANDARD','STANDARD_INFREQUENT_ACCESS'],'Capacity','STANDARD'), bool('serverSideEncryption','Server-side encryption','Security',true), bool('streamsEnabled','DynamoDB Streams','Integration',false)
 ],
 awsKms:[
  ...common(false), text('alias','Key alias','Security','alias/archmind'), sel('keySpec','Key spec',['SYMMETRIC_DEFAULT','RSA_2048','ECC_NIST_P256'],'Security','SYMMETRIC_DEFAULT'), sel('keyUsage','Key usage',['ENCRYPT_DECRYPT','SIGN_VERIFY'],'Security','ENCRYPT_DECRYPT'), bool('enableKeyRotation','Automatic key rotation','Security',true), num('deletionWindowDays','Deletion window (days)','Lifecycle',30), area('keyPolicy','Key policy','Access')
 ],
 awsSecretsManager:[
  ...common(), text('secretName','Secret name','Security'), text('kmsKeyId','KMS key','Security'), num('recoveryWindowDays','Recovery window (days)','Lifecycle',30), bool('rotationEnabled','Automatic rotation','Security',false), num('rotationDays','Rotation interval (days)','Security',30), text('rotationLambdaArn','Rotation Lambda ARN','Integration')
 ],
 awsSecurityHub:[
  ...common(), bool('enableDefaultStandards','Enable default standards','Security',true), bool('awsFoundationalStandard','AWS Foundational Security Best Practices','Standards',true), bool('cisStandard','CIS AWS Foundations','Standards',false), bool('autoEnableControls','Auto-enable new controls','Standards',true)
 ],
 awsNetworkFirewall:[
  ...common(), ref('vpcRef','Amazon VPC',['awsVpc']), area('subnetIds','Firewall subnet IDs','Networking'), text('firewallPolicyArn','Firewall policy ARN','Security'), bool('deleteProtection','Delete protection','Lifecycle',true), bool('subnetChangeProtection','Subnet change protection','Lifecycle',false), bool('loggingEnabled','Firewall logging','Monitoring',true)
 ],
 awsTransitGateway:[
  ...common(), num('amazonSideAsn','Amazon-side ASN','Networking',64512), bool('dnsSupport','DNS support','Networking',true), bool('vpnEcmpSupport','VPN ECMP support','Networking',true), bool('defaultRouteTableAssociation','Default route table association','Routing',true), bool('defaultRouteTablePropagation','Default route table propagation','Routing',true), bool('autoAcceptSharedAttachments','Auto-accept shared attachments','Sharing',false)
 ],
 awsDirectConnect:[
  ...common(), text('locationCode','Direct Connect location','Networking'), text('bandwidth','Bandwidth','Networking','1Gbps'), text('lagId','LAG ID','Networking'), text('vlan','VLAN','Networking'), text('customerAsn','Customer ASN','Routing'), text('virtualInterfaceType','Virtual interface type','Networking','private')
 ],
 awsSiteToSiteVpn:[
  ...common(), ref('vpcRef','VPC / Transit Gateway',['awsVpc','awsTransitGateway']), text('customerGatewayIp','Customer gateway public IP','Networking'), num('customerGatewayAsn','Customer gateway ASN','Routing',65000), sel('tunnelInsideIpVersion','Tunnel IP version',['ipv4','ipv6'],'Networking','ipv4'), bool('staticRoutesOnly','Static routes only','Routing',false), bool('accelerationEnabled','Accelerated VPN','Performance',false)
 ],
 awsCloudFront:[
  ...common(false), text('originDomain','Origin domain','Origins'), sel('viewerProtocolPolicy','Viewer protocol policy',['redirect-to-https','https-only','allow-all'],'Security','redirect-to-https'), text('priceClass','Price class','Distribution','PriceClass_100'), bool('ipv6Enabled','IPv6','Networking',true), bool('wafEnabled','AWS WAF association','Security',true), text('certificateArn','ACM certificate ARN','TLS'), text('defaultRootObject','Default root object','Distribution','index.html'), bool('loggingEnabled','Access logging','Monitoring',true)
 ],
 awsRoute53:[
  ...common(false), text('hostedZoneName','Hosted zone name','DNS'), sel('zoneType','Zone type',['Public','Private'],'DNS','Public'), ref('vpcRef','Private zone VPC',['awsVpc']), text('recordName','Record name','Records'), sel('recordType','Record type',['A','AAAA','CNAME','ALIAS','MX','TXT'],'Records','A'), num('ttl','TTL (seconds)','Records',300), area('recordValues','Record values / alias target','Records')
 ],
 awsAlb:[
  ...common(), area('subnetIds','Subnets','Networking'), area('securityGroupIds','Security groups','Networking'), sel('scheme','Scheme',['internet-facing','internal'],'Networking','internet-facing'), bool('deletionProtection','Deletion protection','Lifecycle',true), text('listenerPort','Listener port','Listeners','443'), sel('listenerProtocol','Listener protocol',['HTTPS','HTTP'],'Listeners','HTTPS'), text('certificateArn','Certificate ARN','TLS'), text('targetGroupArn','Target group ARN','Targets')
 ],
 awsNlb:[
  ...common(), area('subnetIds','Subnets','Networking'), sel('scheme','Scheme',['internet-facing','internal'],'Networking','internal'), bool('crossZoneLoadBalancing','Cross-zone load balancing','Networking',true), bool('deletionProtection','Deletion protection','Lifecycle',true), text('listenerPort','Listener port','Listeners','443'), sel('listenerProtocol','Listener protocol',['TCP','TLS','UDP','TCP_UDP'],'Listeners','TCP'), text('targetGroupArn','Target group ARN','Targets')
 ],
 awsPrivateLink:[
  ...common(), ref('vpcRef','Amazon VPC',['awsVpc']), area('subnetIds','Endpoint subnet IDs','Networking'), area('securityGroupIds','Security groups','Networking'), text('serviceName','Endpoint service name','Networking'), sel('endpointType','Endpoint type',['Interface','Gateway','GatewayLoadBalancer'],'Networking','Interface'), bool('privateDnsEnabled','Private DNS','DNS',true)
 ],
 awsApiGateway:[
  ...common(), sel('apiType','API type',['HTTP','REST','WebSocket'],'API','HTTP'), text('stageName','Stage name','Deployment','prod'), text('integrationUri','Integration URI','Integration'), bool('privateApi','Private API','Networking',false), bool('accessLogging','Access logging','Monitoring',true), bool('xrayTracing','X-Ray tracing','Monitoring',true), text('customDomain','Custom domain','DNS')
 ],
 awsCloudFormation:[
  ...common(), text('stackName','Stack name','Stack'), text('templateLocation','Template URL / path','Stack'), area('parameters','Parameters','Stack'), area('capabilities','Capabilities','Stack'), bool('terminationProtection','Termination protection','Lifecycle',true), text('executionRoleArn','Execution role ARN','Identity')
 ],
 awsCloudWatch:[
  ...common(), text('logGroupName','Log group','Logs'), num('retentionDays','Log retention (days)','Logs',30), text('metricNamespace','Metric namespace','Metrics'), text('alarmName','Alarm name','Alarms'), text('alarmThreshold','Alarm threshold','Alarms'), text('notificationTopicArn','SNS topic ARN','Alarms')
 ],
 awsCloudTrail:[
  ...common(), text('trailName','Trail name','Audit'), bool('multiRegionTrail','Multi-region trail','Audit',true), bool('includeGlobalEvents','Include global service events','Audit',true), bool('logFileValidation','Log file validation','Security',true), text('s3BucketName','S3 bucket','Storage'), text('kmsKeyId','KMS key','Security'), bool('cloudWatchLogsEnabled','CloudWatch Logs integration','Monitoring',true)
 ],
 awsSqs:[
  ...common(false), text('queueName','Queue name','Messaging'), bool('fifoQueue','FIFO queue','Messaging',false), num('visibilityTimeout','Visibility timeout (seconds)','Messaging',30), num('messageRetention','Message retention (seconds)','Messaging',345600), num('receiveWaitTime','Long polling (seconds)','Messaging',20), bool('sseEnabled','Server-side encryption','Security',true), text('deadLetterQueueArn','Dead-letter queue ARN','Resilience')
 ],
 awsSns:[
  ...common(false), text('topicName','Topic name','Messaging'), bool('fifoTopic','FIFO topic','Messaging',false), text('kmsKeyId','KMS key','Security'), bool('contentBasedDeduplication','Content-based deduplication','Messaging',false), area('subscriptions','Subscriptions / endpoints','Integration')
 ],
 awsEventBridge:[
  ...common(), text('eventBusName','Event bus name','Events','default'), text('ruleName','Rule name','Events'), text('eventPattern','Event pattern','Events'), text('scheduleExpression','Schedule expression','Events'), area('targetArns','Target ARNs','Targets'), bool('archiveEnabled','Event archive','Resilience',false)
 ],
 awsStepFunctions:[
  ...common(), text('stateMachineName','State machine name','Workflow'), sel('stateMachineType','Type',['STANDARD','EXPRESS'],'Workflow','STANDARD'), text('roleArn','Execution role ARN','Identity'), area('definition','State machine definition','Workflow'), sel('loggingLevel','Logging level',['OFF','ERROR','ALL'],'Monitoring','ERROR'), bool('xrayTracing','X-Ray tracing','Monitoring',true)
 ],
};

const generic:PropertyField[]=[...common(),text('configuration','Configuration','Main parameters')];

export const getAwsResourceSchema=(type:ResourceType):PropertyField[]=>{
 const base=schemas[type]||generic;
 const seen=new Set<string>();
 return base.filter(f=>{if(seen.has(f.key))return false;seen.add(f.key);return true;});
};
export const awsSchemaGroups=(type:ResourceType)=>Array.from(new Set(getAwsResourceSchema(type).map(f=>f.group)));
